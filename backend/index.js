import express from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import sanitizeHtml from 'sanitize-html';
import slugify from 'slugify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

void rateLimit;
void multer;
void sanitizeHtml;
void slugify;
void bcrypt;
void jwt;

const app = express();

app.use((req, res) => {
  res.json({ ok: true, path: req.url, node: process.version, mongoose: mongoose.version });
});

const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
  console.log(`[server] Listening on port ${port}`);
});
