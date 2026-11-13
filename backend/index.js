import './src/config/env.js';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import { connectDB } from './src/config/db.js';
import { ensureSeeded } from './src/seedData.js';
import { requireAuth } from './src/middleware/auth.js';
import { uploadDir } from './src/middleware/upload.js';
import { notFound, errorHandler } from './src/middleware/errors.js';
import authRoutes from './src/routes/auth.js';
import publicRoutes from './src/routes/public.js';
import adminRoutes from './src/routes/admin/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);

const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.use(cors({ origin: origins.length ? origins : true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.use('/uploads', express.static(uploadDir, { maxAge: '7d', immutable: true }));

let readyPromise;

// Connect and seed once per process; serverless instances reuse this across requests.
export function ensureReady() {
  if (!readyPromise) {
    readyPromise = (async () => {
      const connection = await connectDB();
      await ensureSeeded();
      return connection;
    })().catch((error) => {
      readyPromise = undefined;
      throw error;
    });
  }
  return readyPromise;
}

app.use('/api', async (_req, _res, next) => {
  try {
    await ensureReady();
    next();
  } catch (error) {
    next(error);
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'Calvary Chapel Iloilo API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    node: process.version,
    time: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', requireAuth, adminRoutes);

app.use('/api', notFound);

// When the API is deployed together with the built React app, serve it here.
const clientDist = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { maxAge: '1h' }));
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.json({ message: 'Calvary Chapel Iloilo API is running. Start the client with npm run dev:client.' });
  });
}

app.use(notFound);
app.use(errorHandler);

export default app;

const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
  console.log(`[server] Listening on port ${port}`);
});

ensureReady().catch((error) => {
  console.error('[server] Database not ready at boot; requests will retry:', error.message);
});
