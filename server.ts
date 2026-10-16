import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/db.ts';
import { authRouter } from './server/routes/authRoutes.ts';
import { tourRouter } from './server/routes/tourRoutes.ts';
import { bookingRouter } from './server/routes/bookingRoutes.ts';
import { adminRouter } from './server/routes/adminRoutes.ts';
import { contentRouter } from './server/routes/contentRoutes.ts';
import { mediaRouter } from './server/routes/mediaRoutes.ts';
import { contactRouter } from './server/routes/contactRoutes.ts';

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  initDatabase();

  const app = express();
  app.use(express.json());

  // Serve static uploaded assets
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // Mount API endpoints
  app.use('/api/auth', authRouter);
  app.use('/api/tours', tourRouter);
  app.use('/api/bookings', bookingRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/content', contentRouter);
  app.use('/api/media', mediaRouter);
  app.use('/api/contact', contactRouter);

  // Health / status endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Maha Nepal Trips API' });
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Maha Nepal Trips server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
