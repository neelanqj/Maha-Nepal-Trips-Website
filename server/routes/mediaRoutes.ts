import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { db } from '../db.ts';
import { requireAdmin, AuthenticatedRequest } from '../auth.ts';

export const mediaRouter = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + crypto.randomUUID().slice(0, 6);
    cb(null, `${cleanBase}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and SVG images are permitted.'));
    }
  }
});

// Public: Get all media in library
mediaRouter.get('/', (_req, res) => {
  const items = db.prepare('SELECT * FROM media ORDER BY created_at DESC').all();
  res.json({ media: items });
});

// Admin: Upload new image
mediaRouter.post('/upload', requireAdmin, upload.single('image'), (req: AuthenticatedRequest, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image file uploaded.' });
    return;
  }

  const { alt_text = '', caption = '', focal_point_x = 0.5, focal_point_y = 0.5 } = req.body;
  const id = 'med_' + crypto.randomUUID().slice(0, 8);
  const url = `/uploads/${req.file.filename}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO media (id, filename, original_name, url, mime_type, size_bytes, alt_text, caption, focal_point_x, focal_point_y, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    req.file.filename,
    req.file.originalname,
    url,
    req.file.mimetype,
    req.file.size,
    alt_text || req.file.originalname,
    caption || null,
    Number(focal_point_x) || 0.5,
    Number(focal_point_y) || 0.5,
    now
  );

  res.status(201).json({
    message: 'Image uploaded and registered successfully.',
    media: {
      id,
      filename: req.file.filename,
      original_name: req.file.originalname,
      url,
      mime_type: req.file.mimetype,
      size_bytes: req.file.size,
      alt_text: alt_text || req.file.originalname,
      caption: caption || null,
      focal_point_x: Number(focal_point_x) || 0.5,
      focal_point_y: Number(focal_point_y) || 0.5,
      created_at: now
    }
  });
});

// Admin: Update metadata (alt text, caption, focal points)
mediaRouter.put('/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { alt_text, caption, focal_point_x, focal_point_y } = req.body;

  db.prepare(`
    UPDATE media SET
      alt_text = COALESCE(?, alt_text),
      caption = ?,
      focal_point_x = COALESCE(?, focal_point_x),
      focal_point_y = COALESCE(?, focal_point_y)
    WHERE id = ?
  `).run(
    alt_text,
    caption !== undefined ? caption : null,
    focal_point_x != null ? Number(focal_point_x) : null,
    focal_point_y != null ? Number(focal_point_y) : null,
    id
  );

  res.json({ message: 'Media details updated successfully' });
});

// Admin: Safe Delete (checks if referenced)
mediaRouter.delete('/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const item = db.prepare('SELECT * FROM media WHERE id = ?').get(id) as any;
  if (!item) {
    res.status(404).json({ error: 'Media not found' });
    return;
  }

  // Check if image URL is referenced in tours or site content
  const tourMatches = db.prepare(`
    SELECT title FROM tours
    WHERE cover_image LIKE ? OR gallery_images LIKE ?
  `).all(`%${item.filename}%`, `%${item.filename}%`) as Array<{ title: string }>;

  const contentMatches = db.prepare(`
    SELECT key FROM site_content
    WHERE value LIKE ?
  `).all(`%${item.filename}%`) as Array<{ key: string }>;

  if (tourMatches.length > 0 || contentMatches.length > 0) {
    const references = [
      ...tourMatches.map((t) => `Tour: "${t.title}"`),
      ...contentMatches.map((c) => `Site Section: "${c.key}"`)
    ];
    res.status(409).json({
      error: `Cannot delete image because it is actively used in: ${references.join(', ')}. Please replace or remove its references before deleting.`,
      references
    });
    return;
  }

  // Remove DB record and un-link physical file
  db.prepare('DELETE FROM media WHERE id = ?').run(id);
  const filePath = path.join(UPLOADS_DIR, item.filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch {
      // Ignore file deletion error if already missing
    }
  }

  res.json({ message: 'Image successfully deleted from media library.' });
});
