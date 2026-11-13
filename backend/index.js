import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import './src/config/env.js';

void cors;
void helmet;
void morgan;
void compression;
void cookieParser;

const app = express();

app.use((req, res) => {
  res.json({ ok: true, path: req.url, node: process.version, mongoose: mongoose.version });
});

const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
  console.log(`[server] Listening on port ${port}`);
});
