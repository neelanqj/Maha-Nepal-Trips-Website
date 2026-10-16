import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.ts';
import { requireAdmin, AuthenticatedRequest } from '../auth.ts';

export const contentRouter = Router();

// Public: Get all content in one round-trip for site rendering
contentRouter.get('/all', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM site_content').all() as Array<{ key: string; value: string }>;
  const content: Record<string, any> = {};
  for (const row of rows) {
    try {
      content[row.key] = JSON.parse(row.value);
    } catch {
      content[row.key] = row.value;
    }
  }
  res.json({ content });
});

contentRouter.get('/:key', (req, res) => {
  const { key } = req.params;
  const row = db.prepare('SELECT value FROM site_content WHERE key = ?').get(key) as { value: string } | undefined;
  if (!row) {
    res.status(404).json({ error: 'Content not found' });
    return;
  }
  try {
    res.json({ key, value: JSON.parse(row.value) });
  } catch {
    res.json({ key, value: row.value });
  }
});

// Admin: Update site content
contentRouter.put('/:key', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { key } = req.params;
  const { value } = req.body;

  if (value === undefined) {
    res.status(400).json({ error: 'Value is required' });
    return;
  }

  const strValue = typeof value === 'string' ? value : JSON.stringify(value);
  db.prepare(`
    INSERT INTO site_content (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, strValue);

  db.prepare(`
    INSERT INTO audit_logs (id, admin_email, action, details, created_at)
    VALUES (?, ?, 'CONTENT_UPDATED', ?, ?)
  `).run(
    'log_' + crypto.randomUUID().slice(0, 8),
    req.user?.email || 'admin',
    `Updated site content for section: ${key}`,
    new Date().toISOString()
  );

  res.json({ message: `Content for ${key} updated successfully. Changes are now live.` });
});
