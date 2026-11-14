import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';

// Restore uploads are read from a temporary file and never served publicly.
export const restoreDir = path.join(os.tmpdir(), 'cci-restore');

try {
  fs.mkdirSync(restoreDir, { recursive: true });
} catch (error) {
  console.warn(`[backup] Could not create restore directory: ${error.message}`);
}

const allowedMimes = new Set([
  'application/zip',
  'application/x-zip-compressed',
  'application/json',
  'text/json',
  'text/plain',
  'application/octet-stream',
]);

export const backupUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, restoreDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase() === '.json' ? '.json' : '.zip';
      cb(null, `restore-${Date.now()}-${crypto.randomBytes(5).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 1024 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const name = String(file.originalname || '').toLowerCase();
    const looksRight = name.endsWith('.zip') || name.endsWith('.json');
    if (!looksRight && !allowedMimes.has(file.mimetype)) {
      return cb(new Error('Please choose the .zip or .json backup file.'));
    }
    cb(null, true);
  },
});
