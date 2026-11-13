import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import './src/config/env.js';
import { connectDB } from './src/config/db.js';
import { ensureSeeded } from './src/seedData.js';
import { requireAuth } from './src/middleware/auth.js';
import { uploadDir } from './src/middleware/upload.js';
import { notFound, errorHandler } from './src/middleware/errors.js';
import authRoutes from './src/routes/auth.js';
import publicRoutes from './src/routes/public.js';
import adminRoutes from './src/routes/admin/index.js';

void connectDB;
void ensureSeeded;
void requireAuth;
void authRoutes;
void publicRoutes;
void adminRoutes;
void notFound;
void errorHandler;
void cors;
void helmet;
void morgan;
void compression;
void cookieParser;

const app = express();

app.use((req, res) => {
  res.json({ ok: true, path: req.url, node: process.version, mongoose: mongoose.version, uploadDir });
});

const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
  console.log(`[server] Listening on port ${port}`);
});
