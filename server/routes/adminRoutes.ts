import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.ts';
import { requireAdmin, AuthenticatedRequest } from '../auth.ts';

export const adminRouter = Router();
adminRouter.use(requireAdmin);

function parseJsonField<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

// 1. Dashboard Metrics
adminRouter.get('/metrics', (req: AuthenticatedRequest, res) => {
  const totalRevenue = (db.prepare("SELECT COALESCE(SUM(total_amount), 0) as rev FROM bookings WHERE status = 'confirmed'").get() as any)?.rev || 0;
  const totalBookings = (db.prepare("SELECT COUNT(*) as cnt FROM bookings WHERE status = 'confirmed'").get() as any)?.cnt || 0;
  const upcomingDepartures = (db.prepare("SELECT COUNT(*) as cnt FROM departures WHERE start_date >= date('now') AND status != 'blocked'").get() as any)?.cnt || 0;
  const newInquiries = (db.prepare("SELECT COUNT(*) as cnt FROM inquiries WHERE status = 'new'").get() as any)?.cnt || 0;

  // Recent bookings
  const recentBookings = db.prepare(`
    SELECT b.*, t.title as tour_title, d.start_date as departure_start
    FROM bookings b
    JOIN tours t ON b.tour_id = t.id
    JOIN departures d ON b.departure_id = d.id
    ORDER BY b.created_at DESC
    LIMIT 6
  `).all();

  // Top tours by bookings
  const topTours = db.prepare(`
    SELECT id, title, destination, booking_count, price_per_person, cover_image, is_published
    FROM tours
    WHERE is_archived = 0
    ORDER BY booking_count DESC
    LIMIT 5
  `).all();

  // Departures with conflict or low capacity
  const imminentDepartures = db.prepare(`
    SELECT d.*, t.title as tour_title
    FROM departures d
    JOIN tours t ON d.tour_id = t.id
    WHERE d.start_date >= date('now')
    ORDER BY d.start_date ASC
    LIMIT 6
  `).all();

  res.json({
    metrics: {
      total_revenue: totalRevenue,
      total_bookings: totalBookings,
      upcoming_departures: upcomingDepartures,
      new_inquiries: newInquiries
    },
    recent_bookings: recentBookings,
    top_tours: topTours,
    imminent_departures: imminentDepartures
  });
});

// 2. Tours CRUD & Publishing
adminRouter.post('/tours', (req: AuthenticatedRequest, res) => {
  const data = req.body;
  if (!data.title || !data.destination || !data.price_per_person) {
    res.status(400).json({ error: 'Title, destination, and starting price are required.' });
    return;
  }

  const id = 'tour_' + crypto.randomUUID().slice(0, 8);
  const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + id.slice(-4);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO tours (
      id, slug, title, short_description, full_description, destination, activity,
      duration_days, difficulty, price_per_person, price_per_group, pricing_type, currency,
      cover_image, gallery_images, highlights, itinerary, inclusions, exclusions,
      meeting_point, guiding_languages, cancellation_policy, max_capacity,
      is_published, is_featured, is_archived, booking_count, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
  `).run(
    id,
    slug,
    data.title,
    data.short_description || '',
    data.full_description || '',
    data.destination,
    data.activity || 'High Altitude Trek',
    Number(data.duration_days) || 7,
    data.difficulty || 'Moderate',
    Number(data.price_per_person),
    data.price_per_group ? Number(data.price_per_group) : null,
    data.pricing_type || 'per_person',
    data.currency || 'USD',
    data.cover_image || '/uploads/everest_trail_1792111603554.jpg',
    JSON.stringify(data.gallery_images || []),
    JSON.stringify(data.highlights || []),
    JSON.stringify(data.itinerary || []),
    JSON.stringify(data.inclusions || []),
    JSON.stringify(data.exclusions || []),
    data.meeting_point || 'Tribhuvan International Airport or Kathmandu Hotel',
    JSON.stringify(data.guiding_languages || ['English', 'Nepali']),
    data.cancellation_policy || 'Standard cancellation policy applies.',
    Number(data.max_capacity) || 12,
    data.is_published ? 1 : 0,
    data.is_featured ? 1 : 0,
    now
  );

  // Log audit
  db.prepare(`INSERT INTO audit_logs (id, admin_email, action, details, created_at) VALUES (?, ?, 'TOUR_CREATED', ?, ?)`).run(
    'log_' + crypto.randomUUID().slice(0, 8),
    req.user?.email || 'admin',
    `Created new tour "${data.title}" (ID: ${id})`,
    now
  );

  res.status(201).json({ message: 'Tour created successfully', id, slug });
});

adminRouter.put('/tours/:id', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const data = req.body;

  const existing = db.prepare('SELECT id FROM tours WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Tour not found' });
    return;
  }

  db.prepare(`
    UPDATE tours SET
      title = ?,
      short_description = ?,
      full_description = ?,
      destination = ?,
      activity = ?,
      duration_days = ?,
      difficulty = ?,
      price_per_person = ?,
      price_per_group = ?,
      pricing_type = ?,
      currency = ?,
      cover_image = ?,
      gallery_images = ?,
      highlights = ?,
      itinerary = ?,
      inclusions = ?,
      exclusions = ?,
      meeting_point = ?,
      guiding_languages = ?,
      cancellation_policy = ?,
      max_capacity = ?,
      is_published = ?,
      is_featured = ?
    WHERE id = ?
  `).run(
    data.title,
    data.short_description,
    data.full_description,
    data.destination,
    data.activity,
    Number(data.duration_days),
    data.difficulty,
    Number(data.price_per_person),
    data.price_per_group ? Number(data.price_per_group) : null,
    data.pricing_type,
    data.currency,
    data.cover_image,
    JSON.stringify(data.gallery_images || []),
    JSON.stringify(data.highlights || []),
    JSON.stringify(data.itinerary || []),
    JSON.stringify(data.inclusions || []),
    JSON.stringify(data.exclusions || []),
    data.meeting_point,
    JSON.stringify(data.guiding_languages || ['English', 'Nepali']),
    data.cancellation_policy,
    Number(data.max_capacity),
    data.is_published ? 1 : 0,
    data.is_featured ? 1 : 0,
    id
  );

  // Log audit
  db.prepare(`INSERT INTO audit_logs (id, admin_email, action, details, created_at) VALUES (?, ?, 'TOUR_UPDATED', ?, ?)`).run(
    'log_' + crypto.randomUUID().slice(0, 8),
    req.user?.email || 'admin',
    `Updated tour "${data.title}" (ID: ${id})`,
    new Date().toISOString()
  );

  res.json({ message: 'Tour updated successfully' });
});

// Archive tour safely preserving historical bookings
adminRouter.delete('/tours/:id', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const tour = db.prepare('SELECT title, (SELECT COUNT(*) FROM bookings WHERE tour_id = tours.id) as bookings_count FROM tours WHERE id = ?').get(id) as any;

  if (!tour) {
    res.status(404).json({ error: 'Tour not found' });
    return;
  }

  if (tour.bookings_count > 0) {
    // Preserve history: set archived
    db.prepare('UPDATE tours SET is_archived = 1, is_published = 0 WHERE id = ?').run(id);
    db.prepare(`INSERT INTO audit_logs (id, admin_email, action, details, created_at) VALUES (?, ?, 'TOUR_ARCHIVED', ?, ?)`).run(
      'log_' + crypto.randomUUID().slice(0, 8),
      req.user?.email || 'admin',
      `Archived tour "${tour.title}" preserving ${tour.bookings_count} historical bookings`,
      new Date().toISOString()
    );
    res.json({ message: `Tour has been archived to preserve historical bookings.` });
  } else {
    // No bookings exist: can permanently delete
    db.prepare('DELETE FROM departures WHERE tour_id = ?').run(id);
    db.prepare('DELETE FROM tours WHERE id = ?').run(id);
    res.json({ message: 'Tour and its unused departures deleted.' });
  }
});

// 3. Departures & Conflicts Management
adminRouter.post('/departures', (req: AuthenticatedRequest, res) => {
  const {
    tour_id,
    start_dates, // array of strings or single string
    start_date,
    departure_time = '07:00 AM',
    capacity,
    price_override,
    guide_name = 'Deepak Kushwaha',
    cutoff_hours = 48
  } = req.body;

  const tour = db.prepare('SELECT id, title, duration_days, max_capacity FROM tours WHERE id = ?').get(tour_id) as any;
  if (!tour) {
    res.status(404).json({ error: 'Tour not found' });
    return;
  }

  const datesToSchedule: string[] = Array.isArray(start_dates) && start_dates.length > 0 ? start_dates : [start_date];
  const cap = Number(capacity) || tour.max_capacity || 10;
  const createdIds: string[] = [];
  const conflicts: string[] = [];

  for (const sDate of datesToSchedule) {
    if (!sDate) continue;
    const s = new Date(sDate);
    const e = new Date(s);
    e.setDate(s.getDate() + tour.duration_days);
    const eDate = e.toISOString().split('T')[0];

    // Conflict check: check if guide is already booked on overlapping departure
    const conflict = db.prepare(`
      SELECT d.id, d.start_date, d.end_date, t.title
      FROM departures d
      JOIN tours t ON d.tour_id = t.id
      WHERE d.guide_name = ?
      AND d.status != 'blocked'
      AND (
        (d.start_date <= ? AND d.end_date >= ?) OR
        (d.start_date <= ? AND d.end_date >= ?) OR
        (d.start_date >= ? AND d.end_date <= ?)
      )
    `).get(guide_name, sDate, sDate, eDate, eDate, sDate, eDate) as any;

    if (conflict) {
      conflicts.push(`Date ${sDate} conflicts with guide ${guide_name} already assigned to "${conflict.title}" (${conflict.start_date} to ${conflict.end_date})`);
      continue;
    }

    const depId = 'dep_' + crypto.randomUUID().slice(0, 8);
    db.prepare(`
      INSERT INTO departures (
        id, tour_id, start_date, end_date, departure_time,
        price_override, capacity, booked_count, status, cutoff_hours, guide_name, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'available', ?, ?, ?)
    `).run(
      depId,
      tour.id,
      sDate,
      eDate,
      departure_time,
      price_override ? Number(price_override) : null,
      cap,
      Number(cutoff_hours),
      guide_name,
      new Date().toISOString()
    );
    createdIds.push(depId);
  }

  if (createdIds.length === 0 && conflicts.length > 0) {
    res.status(409).json({ error: 'Scheduling conflict detected for guide: ' + conflicts.join('; ') });
    return;
  }

  res.status(201).json({
    message: `Scheduled ${createdIds.length} departure(s).`,
    created_count: createdIds.length,
    conflicts: conflicts.length > 0 ? conflicts : undefined
  });
});

adminRouter.put('/departures/:id', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { capacity, price_override, status, cutoff_hours, guide_name } = req.body;

  db.prepare(`
    UPDATE departures SET
      capacity = COALESCE(?, capacity),
      price_override = ?,
      status = COALESCE(?, status),
      cutoff_hours = COALESCE(?, cutoff_hours),
      guide_name = COALESCE(?, guide_name)
    WHERE id = ?
  `).run(
    capacity != null ? Number(capacity) : null,
    price_override != null ? Number(price_override) : null,
    status || null,
    cutoff_hours != null ? Number(cutoff_hours) : null,
    guide_name || null,
    id
  );

  res.json({ message: 'Departure updated successfully' });
});

// 4. Bookings & Refunds
adminRouter.get('/bookings', (req: AuthenticatedRequest, res) => {
  const { status, search } = req.query;

  const conditions: string[] = [];
  const params: any[] = [];

  if (status && status !== 'all') {
    conditions.push('b.status = ?');
    params.push(status);
  }

  if (search) {
    conditions.push('(b.reference_code LIKE ? OR b.customer_name LIKE ? OR b.customer_email LIKE ? OR t.title LIKE ?)');
    const term = `%${String(search).trim()}%`;
    params.push(term, term, term, term);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db.prepare(`
    SELECT
      b.*,
      t.title as tour_title,
      d.start_date as departure_start,
      d.end_date as departure_end,
      d.departure_time,
      d.guide_name
    FROM bookings b
    JOIN tours t ON b.tour_id = t.id
    JOIN departures d ON b.departure_id = d.id
    ${where}
    ORDER BY b.created_at DESC
  `).all(...params) as any[];

  const bookings = rows.map((b) => ({
    ...b,
    tour_snapshot: parseJsonField(b.tour_snapshot, {}),
    traveler_details: parseJsonField(b.traveler_details, []),
    options_selected: parseJsonField(b.options_selected, {})
  }));

  res.json({ bookings });
});

adminRouter.post('/bookings/:id/refund', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { refund_amount, refund_reason } = req.body;

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as any;
  if (!booking) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }

  const amt = Number(refund_amount);
  if (!amt || amt <= 0 || amt > booking.total_amount) {
    res.status(400).json({ error: `Refund amount must be between 0.01 and ${booking.total_amount}` });
    return;
  }

  const now = new Date().toISOString();

  // Atomically process refund and restore departure seat count
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare(`
      UPDATE bookings
      SET status = 'refunded',
          payment_status = 'refunded',
          refund_amount = ?,
          refund_reason = ?
      WHERE id = ?
    `).run(amt, refund_reason || 'Authorized refund under cancellation policy', id);

    // Free up booked count on departure
    db.prepare(`
      UPDATE departures
      SET booked_count = MAX(0, booked_count - ?),
          status = 'available'
      WHERE id = ?
    `).run(booking.travelers_count, booking.departure_id);

    // Record audit log
    db.prepare(`
      INSERT INTO audit_logs (id, admin_email, action, details, created_at)
      VALUES (?, ?, 'REFUND_PROCESSED', ?, ?)
    `).run(
      'log_' + crypto.randomUUID().slice(0, 8),
      req.user?.email || 'admin',
      `Processed refund of $${amt} for booking ${booking.reference_code}. Reason: ${refund_reason}`,
      now
    );

    db.exec('COMMIT');

    res.json({
      message: `Refund of $${amt} processed successfully. Departure places have been released.`,
      booking_id: id,
      refund_amount: amt
    });
  } catch (err: any) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: 'Failed to process refund: ' + err.message });
  }
});

adminRouter.get('/audit-logs', (req: AuthenticatedRequest, res) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50').all();
  res.json({ logs });
});
