import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.ts';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../auth.ts';

export const bookingRouter = Router();

function generateReference(): string {
  const year = new Date().getFullYear();
  const random = crypto.randomInt(1000, 9999);
  return `MNT-${year}-${random}`;
}

// 1. Temporary Reservation Lock (15-minute lock with ACID concurrency check)
bookingRouter.post('/reserve', optionalAuth, (req: AuthenticatedRequest, res) => {
  const { departure_id, travelers_count } = req.body;
  const count = Number(travelers_count);

  if (!departure_id || !count || count < 1) {
    res.status(400).json({ error: 'Departure and valid traveler count are required.' });
    return;
  }

  // Purge any expired reservations first
  const nowIso = new Date().toISOString();
  db.prepare(`UPDATE reservations SET status = 'expired' WHERE status = 'active' AND expires_at <= ?`).run(nowIso);

  // Check departure and capacity within a transaction
  db.exec('BEGIN IMMEDIATE');
  try {
    const dep = db.prepare('SELECT * FROM departures WHERE id = ?').get(departure_id) as any;
    if (!dep) {
      db.exec('ROLLBACK');
      res.status(404).json({ error: 'Departure not found.' });
      return;
    }

    if (dep.status === 'blocked' || dep.status === 'sold_out') {
      db.exec('ROLLBACK');
      res.status(409).json({ error: 'This departure is no longer open for booking.' });
      return;
    }

    // Check cutoff hours
    const depDate = new Date(dep.start_date + 'T00:00:00Z');
    const cutoffTime = depDate.getTime() - (dep.cutoff_hours || 48) * 3600 * 1000;
    if (Date.now() > cutoffTime) {
      db.exec('ROLLBACK');
      res.status(409).json({ error: 'Booking cutoff has passed for this departure date.' });
      return;
    }

    // Calculate active unexpired reservations for this departure
    const activeRes = db.prepare(`
      SELECT COALESCE(SUM(travelers_count), 0) as reserved
      FROM reservations
      WHERE departure_id = ? AND status = 'active' AND expires_at > ?
    `).get(departure_id, nowIso) as { reserved: number };

    const remainingSpots = dep.capacity - dep.booked_count - activeRes.reserved;
    if (remainingSpots < count) {
      db.exec('ROLLBACK');
      res.status(409).json({
        error: `Only ${Math.max(0, remainingSpots)} places remaining on this departure. Please reduce traveler count or select another date.`,
        remaining: Math.max(0, remainingSpots)
      });
      return;
    }

    // Create reservation for 15 minutes
    const reservationId = 'res_' + crypto.randomUUID().slice(0, 8);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const userId = req.user?.id || null;

    db.prepare(`
      INSERT INTO reservations (id, departure_id, user_id, travelers_count, expires_at, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?)
    `).run(reservationId, departure_id, userId, count, expiresAt, nowIso);

    db.exec('COMMIT');

    res.json({
      reservation_id: reservationId,
      departure_id,
      travelers_count: count,
      expires_at: expiresAt,
      message: `Your ${count} place(s) are held for 15 minutes while you complete checkout.`
    });
  } catch (err: any) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: 'Failed to reserve places: ' + err.message });
  }
});

// 2. Process Checkout & Payment
bookingRouter.post('/checkout', requireAuth, (req: AuthenticatedRequest, res) => {
  const {
    reservation_id,
    departure_id,
    travelers_count,
    customer_name,
    customer_email,
    customer_phone,
    traveler_details,
    selected_options,
    payment_token,
    card_brand = 'Visa',
    card_last4 = '4242'
  } = req.body;

  const count = Number(travelers_count);
  if (!customer_name || !customer_email || !count || count < 1) {
    res.status(400).json({ error: 'Customer information and valid traveler count are required.' });
    return;
  }

  const nowIso = new Date().toISOString();

  // Atomically verify reservation or remaining capacity, charge card, and persist booking
  db.exec('BEGIN IMMEDIATE');
  try {
    const dep = db.prepare('SELECT * FROM departures WHERE id = ?').get(departure_id) as any;
    if (!dep) {
      db.exec('ROLLBACK');
      res.status(404).json({ error: 'Selected departure was not found.' });
      return;
    }

    const tour = db.prepare('SELECT * FROM tours WHERE id = ?').get(dep.tour_id) as any;
    if (!tour) {
      db.exec('ROLLBACK');
      res.status(404).json({ error: 'Associated tour was not found.' });
      return;
    }

    // Verify reservation if provided
    let reservationValid = false;
    if (reservation_id) {
      const resRecord = db.prepare('SELECT * FROM reservations WHERE id = ? AND departure_id = ?').get(reservation_id, departure_id) as any;
      if (resRecord && resRecord.status === 'active' && new Date(resRecord.expires_at).getTime() > Date.now()) {
        reservationValid = true;
      }
    }

    // If reservation wasn't valid/held, check current free capacity directly
    if (!reservationValid) {
      const activeRes = db.prepare(`
        SELECT COALESCE(SUM(travelers_count), 0) as reserved
        FROM reservations
        WHERE departure_id = ? AND status = 'active' AND expires_at > ?
      `).get(departure_id, nowIso) as { reserved: number };

      const remaining = dep.capacity - dep.booked_count - activeRes.reserved;
      if (remaining < count) {
        db.exec('ROLLBACK');
        res.status(409).json({
          error: 'Your reservation hold expired and the requested places have been taken. Please choose another departure date.'
        });
        return;
      }
    }

    // Server-side calculation of total amount:
    // Tour price basis (per-person vs per-group, departure price override)
    const basePrice = dep.price_override != null ? dep.price_override : (
      tour.pricing_type === 'per_group' ? tour.price_per_group : tour.price_per_person
    );

    let subtotal = tour.pricing_type === 'per_group' ? basePrice : basePrice * count;

    // Calculate options add-ons (e.g., solo supplement, porter, airport pickup)
    let addOnsTotal = 0;
    if (selected_options && typeof selected_options === 'object') {
      if (selected_options.solo_room) addOnsTotal += 180 * count;
      if (selected_options.extra_porter) addOnsTotal += 150 * count;
      if (selected_options.airport_pickup_vip) addOnsTotal += 40;
    }

    const totalAmount = subtotal + addOnsTotal;

    // Simulate payment authorization & gateway transaction
    const gatewayTxId = 'txn_' + crypto.randomUUID().slice(0, 12);
    const paymentId = 'pay_' + crypto.randomUUID().slice(0, 8);
    const bookingId = 'bk_' + crypto.randomUUID().slice(0, 8);
    const referenceCode = generateReference();

    // Immutable tour snapshot stored with booking
    const tourSnapshot = JSON.stringify({
      tour_id: tour.id,
      title: tour.title,
      destination: tour.destination,
      duration_days: tour.duration_days,
      meeting_point: tour.meeting_point,
      cancellation_policy: tour.cancellation_policy,
      inclusions: tour.inclusions,
      departure_start_date: dep.start_date,
      departure_end_date: dep.end_date,
      departure_time: dep.departure_time,
      guide_name: dep.guide_name,
      base_rate: basePrice,
      pricing_type: tour.pricing_type,
      currency: tour.currency
    });

    // 1. Insert booking
    db.prepare(`
      INSERT INTO bookings (
        id, reference_code, tour_id, departure_id, user_id,
        customer_name, customer_email, customer_phone, travelers_count,
        traveler_details, total_amount, currency, pricing_type,
        tour_snapshot, options_selected, status, payment_status, payment_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'succeeded', ?, ?)
    `).run(
      bookingId,
      referenceCode,
      tour.id,
      dep.id,
      req.user?.id || null,
      customer_name,
      customer_email,
      customer_phone || '',
      count,
      JSON.stringify(traveler_details || []),
      totalAmount,
      tour.currency || 'USD',
      tour.pricing_type,
      tourSnapshot,
      JSON.stringify(selected_options || {}),
      paymentId,
      nowIso
    );

    // 2. Insert payment record
    db.prepare(`
      INSERT INTO payments (
        id, booking_id, amount, currency, status, gateway, gateway_transaction_id, card_brand, card_last4, created_at
      ) VALUES (?, ?, ?, ?, 'succeeded', 'MahaPay Direct Card', ?, ?, ?, ?)
    `).run(
      paymentId,
      bookingId,
      totalAmount,
      tour.currency || 'USD',
      gatewayTxId,
      card_brand,
      card_last4,
      nowIso
    );

    // 3. Update departure booked_count
    const newBookedCount = dep.booked_count + count;
    const newStatus = newBookedCount >= dep.capacity ? 'sold_out' : dep.status;
    db.prepare(`UPDATE departures SET booked_count = ?, status = ? WHERE id = ?`).run(
      newBookedCount,
      newStatus,
      dep.id
    );

    // 4. Update tour total booking count
    db.prepare(`UPDATE tours SET booking_count = booking_count + 1 WHERE id = ?`).run(tour.id);

    // 5. Convert reservation if one existed
    if (reservation_id) {
      db.prepare(`UPDATE reservations SET status = 'converted' WHERE id = ?`).run(reservation_id);
    }

    // 6. Record audit log
    db.prepare(`
      INSERT INTO audit_logs (id, admin_email, action, details, created_at)
      VALUES (?, ?, 'BOOKING_CREATED', ?, ?)
    `).run(
      'log_' + crypto.randomUUID().slice(0, 8),
      customer_email,
      `New direct booking ${referenceCode} confirmed for ${tour.title} (${count} travelers, $${totalAmount})`,
      nowIso
    );

    db.exec('COMMIT');

    res.status(201).json({
      message: 'Booking confirmed! We are thrilled to welcome you to Nepal.',
      booking: {
        id: bookingId,
        reference_code: referenceCode,
        tour_title: tour.title,
        departure_start_date: dep.start_date,
        departure_end_date: dep.end_date,
        departure_time: dep.departure_time,
        travelers_count: count,
        total_amount: totalAmount,
        currency: tour.currency,
        meeting_point: tour.meeting_point,
        customer_name,
        customer_email,
        payment_status: 'succeeded',
        card_brand,
        card_last4,
        gateway_transaction_id: gatewayTxId,
        created_at: nowIso
      }
    });
  } catch (err: any) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: 'Failed to complete checkout: ' + err.message });
  }
});

// 3. Customer "My Bookings"
bookingRouter.get('/my', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const rows = db.prepare(`
    SELECT
      b.*,
      t.title as tour_title,
      t.slug as tour_slug,
      t.cover_image as tour_cover,
      t.destination,
      d.start_date as departure_start,
      d.end_date as departure_end,
      d.departure_time
    FROM bookings b
    JOIN tours t ON b.tour_id = t.id
    JOIN departures d ON b.departure_id = d.id
    WHERE b.user_id = ? OR b.customer_email = ?
    ORDER BY b.created_at DESC
  `).all(req.user.id, req.user.email) as any[];

  const bookings = rows.map((b) => ({
    ...b,
    tour_snapshot: JSON.parse(b.tour_snapshot || '{}'),
    traveler_details: JSON.parse(b.traveler_details || '[]'),
    options_selected: JSON.parse(b.options_selected || '{}')
  }));

  res.json({ bookings });
});

// 4. View Booking Receipt by Reference Code
bookingRouter.get('/receipt/:reference', optionalAuth, (req: AuthenticatedRequest, res) => {
  const { reference } = req.params;

  const row = db.prepare(`
    SELECT
      b.*,
      t.title as tour_title,
      t.slug as tour_slug,
      t.cover_image as tour_cover,
      t.duration_days,
      d.start_date as departure_start,
      d.end_date as departure_end,
      d.departure_time,
      d.guide_name,
      p.card_brand,
      p.card_last4,
      p.gateway_transaction_id
    FROM bookings b
    JOIN tours t ON b.tour_id = t.id
    JOIN departures d ON b.departure_id = d.id
    LEFT JOIN payments p ON b.payment_id = p.id
    WHERE b.reference_code = ?
  `).get(reference) as any;

  if (!row) {
    res.status(404).json({ error: 'Booking receipt not found.' });
    return;
  }

  // Security check: if user is logged in and not admin, must match user_id or email
  const isAdmin = req.user?.role === 'admin';
  if (!isAdmin && req.user && req.user.id !== row.user_id && req.user.email !== row.customer_email) {
    res.status(403).json({ error: 'Unauthorized to view this booking.' });
    return;
  }

  res.json({
    booking: {
      ...row,
      tour_snapshot: JSON.parse(row.tour_snapshot || '{}'),
      traveler_details: JSON.parse(row.traveler_details || '[]'),
      options_selected: JSON.parse(row.options_selected || '{}')
    }
  });
});

// 5. Request Cancellation
bookingRouter.post('/:id/request-cancellation', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as any;
  if (!booking) {
    res.status(404).json({ error: 'Booking not found.' });
    return;
  }

  // Check authorization
  const isAdmin = req.user?.role === 'admin';
  if (!isAdmin && req.user?.id !== booking.user_id && req.user?.email !== booking.customer_email) {
    res.status(403).json({ error: 'Unauthorized to cancel this booking.' });
    return;
  }

  const dep = db.prepare('SELECT * FROM departures WHERE id = ?').get(booking.departure_id) as any;
  const now = new Date();
  const depStart = dep ? new Date(dep.start_date) : now;
  const daysUntilDeparture = Math.floor((depStart.getTime() - now.getTime()) / (1000 * 3600 * 24));

  let estimatedRefundPct = 0;
  if (daysUntilDeparture >= 30) {
    estimatedRefundPct = 100;
  } else if (daysUntilDeparture >= 15) {
    estimatedRefundPct = 50;
  } else {
    estimatedRefundPct = 0;
  }

  const estimatedRefundAmount = (booking.total_amount * estimatedRefundPct) / 100;

  db.prepare(`
    UPDATE bookings
    SET cancellation_requested_at = ?, cancellation_notes = ?
    WHERE id = ?
  `).run(now.toISOString(), reason || 'Customer requested cancellation via portal', id);

  res.json({
    message: 'Cancellation request submitted. Deepak and the Maha Nepal Trips team will review and process under the published cancellation policy.',
    days_until_departure: daysUntilDeparture,
    estimated_refund_percentage: estimatedRefundPct,
    estimated_refund_amount: estimatedRefundAmount,
    currency: booking.currency
  });
});
