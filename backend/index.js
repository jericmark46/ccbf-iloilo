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
import { auditTrail } from './src/middleware/audit.js';
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

const configuredOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((value) => value.trim().replace(/\/+$/, ''))
  .filter(Boolean);

// Optional regex for preview deployments, e.g. ^https://ccbf-iloilo[a-z0-9-]*\.vercel\.app$
const originPattern = process.env.CLIENT_ORIGIN_REGEX
  ? new RegExp(process.env.CLIENT_ORIGIN_REGEX)
  : null;

const isLocalOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);

const corsOptions = {
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  // The admin sends its JWT as a bearer token, so the preflight must allow it.
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
  origin(origin, callback) {
    // No Origin header: same-origin calls, server-to-server, curl.
    if (!origin) return callback(null, true);
    const clean = origin.replace(/\/+$/, '');
    if (
      configuredOrigins.includes(clean) ||
      isLocalOrigin(clean) ||
      (originPattern && originPattern.test(clean))
    ) {
      return callback(null, true);
    }
    // Rejecting here only withholds the CORS headers; the browser does the rest.
    console.warn('[cors] Blocked origin:', clean);
    return callback(null, false);
  },
};

app.use(cors(corsOptions));
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

// API payloads include sessions and church data, so keep them out of any shared
// cache. This also stops browsers from reusing an older cached response (for
// example one stored without CORS headers) after a deployment.
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

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
// requireAuth fills in req.user, which the audit trail needs to name the actor.
app.use('/api/admin', requireAuth, auditTrail, adminRoutes);

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
