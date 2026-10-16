import { Router } from 'express';
import { db } from '../db.ts';
import { optionalAuth, AuthenticatedRequest } from '../auth.ts';

export const tourRouter = Router();

function safeJsonParse<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function formatTour(row: any) {
  if (!row) return null;
  return {
    ...row,
    gallery_images: safeJsonParse(row.gallery_images, []),
    highlights: safeJsonParse(row.highlights, []),
    itinerary: safeJsonParse(row.itinerary, []),
    inclusions: safeJsonParse(row.inclusions, []),
    exclusions: safeJsonParse(row.exclusions, []),
    guiding_languages: safeJsonParse(row.guiding_languages, ['English', 'Nepali']),
    is_published: Boolean(row.is_published),
    is_featured: Boolean(row.is_featured),
    is_archived: Boolean(row.is_archived)
  };
}

tourRouter.get('/', optionalAuth, (req: AuthenticatedRequest, res) => {
  const {
    destination,
    activity,
    difficulty,
    min_price,
    max_price,
    min_duration,
    max_duration,
    travel_date,
    search,
    featured,
    limit = 20,
    offset = 0
  } = req.query;

  const isAdmin = req.user?.role === 'admin';
  const conditions: string[] = [];
  const params: any[] = [];

  if (!isAdmin) {
    conditions.push('tours.is_published = 1');
    conditions.push('tours.is_archived = 0');
  }

  if (featured === 'true' || featured === '1') {
    conditions.push('tours.is_featured = 1');
  }

  if (destination && destination !== 'All') {
    conditions.push('tours.destination = ?');
    params.push(destination);
  }

  if (activity && activity !== 'All') {
    conditions.push('tours.activity = ?');
    params.push(activity);
  }

  if (difficulty && difficulty !== 'All') {
    conditions.push('tours.difficulty = ?');
    params.push(difficulty);
  }

  if (min_price) {
    conditions.push('tours.price_per_person >= ?');
    params.push(Number(min_price));
  }

  if (max_price) {
    conditions.push('tours.price_per_person <= ?');
    params.push(Number(max_price));
  }

  if (min_duration) {
    conditions.push('tours.duration_days >= ?');
    params.push(Number(min_duration));
  }

  if (max_duration) {
    conditions.push('tours.duration_days <= ?');
    params.push(Number(max_duration));
  }

  if (search) {
    conditions.push('(tours.title LIKE ? OR tours.short_description LIKE ? OR tours.destination LIKE ?)');
    const term = `%${String(search).trim()}%`;
    params.push(term, term, term);
  }

  // If travel_date is specified, only include tours having available departure around or after that date
  if (travel_date) {
    conditions.push(`
      EXISTS (
        SELECT 1 FROM departures
        WHERE departures.tour_id = tours.id
        AND departures.start_date >= ?
        AND departures.status = 'available'
      )
    `);
    params.push(String(travel_date));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countSql = `SELECT COUNT(*) as total FROM tours ${whereClause}`;
  const totalCount = (db.prepare(countSql).get(...params) as { total: number })?.total || 0;

  const listSql = `
    SELECT tours.*,
      (SELECT COUNT(*) FROM departures WHERE tour_id = tours.id AND status = 'available' AND start_date >= date('now')) as available_departures_count
    FROM tours
    ${whereClause}
    ORDER BY tours.is_featured DESC, tours.booking_count DESC, tours.title ASC
    LIMIT ? OFFSET ?
  `;

  const rows = db.prepare(listSql).all(...params, Number(limit), Number(offset));
  const tours = rows.map(formatTour);

  res.json({
    tours,
    total: totalCount,
    limit: Number(limit),
    offset: Number(offset)
  });
});

tourRouter.get('/:slugOrId', optionalAuth, (req: AuthenticatedRequest, res) => {
  const { slugOrId } = req.params;
  const isAdmin = req.user?.role === 'admin';

  let row = db.prepare('SELECT * FROM tours WHERE slug = ?').get(slugOrId);
  if (!row) {
    row = db.prepare('SELECT * FROM tours WHERE id = ?').get(slugOrId);
  }

  if (!row) {
    res.status(404).json({ error: 'Tour not found' });
    return;
  }

  const tour = formatTour(row);
  if (!isAdmin && (!tour.is_published || tour.is_archived)) {
    res.status(404).json({ error: 'Tour not found or currently unavailable' });
    return;
  }

  // Fetch upcoming departures with real-time remaining capacity
  const nowIso = new Date().toISOString();
  const depRows = db.prepare(`
    SELECT
      d.*,
      COALESCE(
        (SELECT SUM(travelers_count) FROM reservations WHERE departure_id = d.id AND status = 'active' AND expires_at > ?),
        0
      ) as reserved_count
    FROM departures d
    WHERE d.tour_id = ?
    ORDER BY d.start_date ASC
  `).all(nowIso, tour.id) as any[];

  const departures = depRows.map((d) => {
    const remaining = Math.max(0, d.capacity - d.booked_count - d.reserved_count);
    return {
      ...d,
      remaining_places: remaining,
      is_sold_out: remaining <= 0 || d.status === 'sold_out',
      is_past: new Date(d.start_date).getTime() < Date.now()
    };
  });

  res.json({
    tour,
    departures
  });
});
