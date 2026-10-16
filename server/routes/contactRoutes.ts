import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.ts';
import { requireAdmin, AuthenticatedRequest } from '../auth.ts';

export const contactRouter = Router();

contactRouter.post('/inquiry', (req, res) => {
  const { name, email, phone, desired_trip, preferred_dates, traveler_count, message, _hp_company } = req.body;

  // Spam protection honeypot
  if (_hp_company) {
    // Silently drop bot submissions
    res.json({ message: 'Thank you for your message! Deepak will be in touch shortly.' });
    return;
  }

  if (!name || !email || !message) {
    res.status(400).json({ error: 'Name, email, and message are required.' });
    return;
  }

  const id = 'inq_' + crypto.randomUUID().slice(0, 8);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO inquiries (id, name, email, phone, desired_trip, preferred_dates, traveler_count, message, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)
  `).run(
    id,
    String(name).trim(),
    String(email).trim().toLowerCase(),
    phone ? String(phone).trim() : null,
    desired_trip || 'General Inquiry',
    preferred_dates || null,
    traveler_count ? Number(traveler_count) : null,
    String(message).trim(),
    now
  );

  res.status(201).json({
    message: 'Thank you! Your custom itinerary inquiry has been received directly by Deepak Kushwaha. He will review your dates and reply within 24 hours.'
  });
});

contactRouter.get('/inquiries', requireAdmin, (req: AuthenticatedRequest, res) => {
  const inquiries = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all();
  res.json({ inquiries });
});

contactRouter.patch('/inquiries/:id/status', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(status, id);
  res.json({ message: 'Inquiry status updated' });
});
