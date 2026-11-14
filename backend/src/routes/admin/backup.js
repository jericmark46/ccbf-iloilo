import { Router } from 'express';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { ZipArchive } from 'archiver';
import unzipper from 'unzipper';
import mongoose from 'mongoose';

import Post from '../../models/Post.js';
import Page from '../../models/Page.js';
import Ministry from '../../models/Ministry.js';
import Activity from '../../models/Activity.js';
import GivingOption from '../../models/GivingOption.js';
import NavLink from '../../models/NavLink.js';
import UpdateCategory from '../../models/UpdateCategory.js';
import Media from '../../models/Media.js';
import Comment from '../../models/Comment.js';
import ContactMessage from '../../models/ContactMessage.js';
import User from '../../models/User.js';
import SiteSettings from '../../models/SiteSettings.js';
import AuditLog from '../../models/AuditLog.js';
import PageVisit from '../../models/PageVisit.js';

import { asyncHandler, assert, HttpError } from '../../utils/http.js';
import { sanitizePermissions } from '../../utils/permissions.js';
import { recordAudit } from '../../middleware/audit.js';
import { backupUpload } from '../../middleware/backupUpload.js';
import { uploadDir } from '../../middleware/upload.js';

const router = Router();

const BACKUP_VERSION = 1;
const MAX_DATA_BYTES = 100 * 1024 * 1024;
const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;
const UPLOAD_ENTRY_RE = /^uploads\/[A-Za-z0-9][A-Za-z0-9._-]*$/;

const COLLECTIONS = [
  { key: 'posts', model: Post },
  { key: 'pages', model: Page },
  { key: 'ministries', model: Ministry },
  { key: 'activities', model: Activity },
  { key: 'givingoptions', model: GivingOption },
  { key: 'navlinks', model: NavLink },
  { key: 'updatecategories', model: UpdateCategory },
  { key: 'medias', model: Media },
  { key: 'comments', model: Comment },
  { key: 'contactmessages', model: ContactMessage },
  { key: 'users', model: User },
  { key: 'sitesettings', model: SiteSettings },
];

const OPTIONAL_COLLECTIONS = [
  { key: 'auditlogs', model: AuditLog },
  { key: 'pagevisits', model: PageVisit },
];

const REQUIRED_KEYS = COLLECTIONS.map((item) => item.key);
const MODEL_BY_KEY = new Map(
  [...COLLECTIONS, ...OPTIONAL_COLLECTIONS].map((item) => [item.key, item.model])
);

// Content is written child-first so references are already resolvable.
const RESTORE_ORDER = [
  'updatecategories',
  'navlinks',
  'pages',
  'ministries',
  'activities',
  'givingoptions',
  'posts',
  'comments',
  'contactmessages',
  'medias',
  'auditlogs',
  'pagevisits',
];

const USER_REF_FIELDS = {
  posts: 'author',
  pages: 'updatedBy',
  medias: 'uploadedBy',
  auditlogs: 'actor',
};

// JSON turns ObjectIds and Dates into strings; raw inserts would keep them as
// strings and break id lookups, so convert the known fields back.
const ID_KEYS = new Set(['_id', 'author', 'updatedBy', 'uploadedBy', 'post', 'parent', 'actor']);
const DATE_KEYS = new Set(['createdAt', 'updatedAt', 'lastLogin', 'lastActiveAt', 'startAt', 'endAt']);

function reviveValue(value, key) {
  if (Array.isArray(value)) return value.map((entry) => reviveValue(entry, key));
  if (value && typeof value === 'object') {
    for (const childKey of Object.keys(value)) {
      value[childKey] = reviveValue(value[childKey], childKey);
    }
    return value;
  }
  if (typeof value !== 'string') return value;
  if (ID_KEYS.has(key) && OBJECT_ID_RE.test(value)) return new mongoose.Types.ObjectId(value);
  if (DATE_KEYS.has(key)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return value;
}

const reviveDoc = (doc) => reviveValue(doc, '');

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

async function uploadFiles() {
  const entries = await fsp.readdir(uploadDir, { withFileTypes: true }).catch(() => []);
  return entries.filter((entry) => entry.isFile()).map((entry) => path.join(uploadDir, entry.name));
}

async function describeFiles(paths) {
  const files = await Promise.all(
    paths.map(async (filePath) => {
      const stat = await fsp.stat(filePath).catch(() => null);
      return stat ? { path: `uploads/${path.basename(filePath)}`, size: stat.size } : null;
    })
  );
  return files.filter(Boolean);
}

function stamp() {
  return new Date().toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '-');
}

router.get(
  '/info',
  asyncHandler(async (_req, res) => {
    const counts = {};
    for (const { key, model } of [...COLLECTIONS, ...OPTIONAL_COLLECTIONS]) {
      counts[key] = await model.collection.countDocuments();
    }

    let files = 0;
    let bytes = 0;
    const stat = await fsp.stat(uploadDir).catch(() => null);
    if (stat?.isDirectory()) {
      for (const entry of await uploadFiles()) {
        const fileStat = await fsp.stat(entry).catch(() => null);
        if (fileStat) {
          files += 1;
          bytes += fileStat.size;
        }
      }
    }

    res.json({
      version: BACKUP_VERSION,
      counts,
      uploads: { files, bytes },
      ephemeral: Boolean(process.env.VERCEL),
    });
  })
);

router.get(
  '/export',
  asyncHandler(async (req, res) => {
    const format = req.query.format === 'json' ? 'json' : 'zip';
    const includeAudit = ['1', 'true', 'yes'].includes(String(req.query.includeAudit).toLowerCase());

    const collections = {};
    for (const { key, model } of COLLECTIONS) {
      collections[key] = await model.collection.find({}).toArray();
    }
    if (includeAudit) {
      for (const { key, model } of OPTIONAL_COLLECTIONS) {
        collections[key] = await model.collection.find({}).toArray();
      }
    }

    const filePaths = await uploadFiles();
    const files = await describeFiles(filePaths);

    const payload = {
      format: 'cc-backup',
      version: BACKUP_VERSION,
      app: 'Calvary Chapel Iloilo',
      exportedAt: new Date().toISOString(),
      collections,
      files,
    };

    const name = `cci-backup-${stamp()}`;
    res.setHeader('Cache-Control', 'no-store');
    if (process.env.VERCEL) res.set('X-Accel-Buffering', 'no');

    if (format === 'json') {
      res.setHeader('Content-Disposition', `attachment; filename="${name}.json"`);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.send(JSON.stringify(payload));
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${name}.zip"`);
      res.setHeader('Content-Type', 'application/zip');

      const archive = new ZipArchive({ zlib: { level: 6 } });
      archive.on('warning', (error) => {
        if (error?.code !== 'ENOENT') console.warn('[backup] export warning:', error.message);
      });
      archive.on('error', (error) => {
        console.error('[backup] export failed:', error.message);
        res.destroy(error);
      });

      archive.pipe(res);
      archive.append(JSON.stringify(payload), { name: 'data.json' });
      for (const filePath of filePaths) {
        archive.file(filePath, { name: `uploads/${path.basename(filePath)}` });
      }
      await archive.finalize();
    }

    await recordAudit({
      req,
      action: 'exported',
      entity: 'backup',
      label: 'site backup',
      summary: `downloaded a site backup (${format.toUpperCase()})`,
    });
  })
);

async function readBackup(file) {
  const name = String(file.originalname || '').toLowerCase();
  const isJson = name.endsWith('.json') || /json/i.test(file.mimetype || '');

  if (isJson) {
    const stat = await fsp.stat(file.path);
    assert(stat.size <= MAX_DATA_BYTES, 400, 'That backup file is too large to read.');
    const raw = await fsp.readFile(file.path, 'utf8');
    try {
      return { payload: JSON.parse(raw), archive: null };
    } catch {
      assert(false, 400, 'That backup file is not valid JSON.');
    }
  }

  let directory;
  try {
    directory = await unzipper.Open.file(file.path);
  } catch {
    assert(false, 400, 'That file is not a readable .zip backup.');
  }

  const entry = directory.files.find((item) => item.path === 'data.json' || item.path === './data.json');
  assert(entry, 400, 'That backup does not contain data.json.');
  const buffer = await entry.buffer();
  assert(buffer.length <= MAX_DATA_BYTES, 400, 'The backup data is too large to restore.');

  try {
    return { payload: JSON.parse(buffer.toString('utf8')), archive: directory };
  } catch {
    assert(false, 400, 'The backup data.json is not valid JSON.');
  }
}

function validatePayload(payload) {
  assert(payload && typeof payload === 'object' && !Array.isArray(payload), 400, 'That file is not a site backup.');
  assert(payload.format === 'cc-backup', 400, 'That file is not a Calvary Chapel site backup.');
  assert(Number(payload.version) <= BACKUP_VERSION, 400, 'That backup came from a newer version of the site.');

  const source = payload.collections;
  assert(source && typeof source === 'object' && !Array.isArray(source), 400, 'The backup has no site data.');

  const collections = {};
  for (const key of REQUIRED_KEYS) {
    const docs = source[key];
    assert(Array.isArray(docs), 400, `The backup is missing the "${key}" data.`);
    for (const doc of docs) {
      assert(
        doc && typeof doc === 'object' && OBJECT_ID_RE.test(String(doc._id)),
        400,
        `The backup contains an invalid record in "${key}".`
      );
    }
    collections[key] = docs;
  }

  const optional = {};
  for (const { key } of OPTIONAL_COLLECTIONS) {
    optional[key] = Array.isArray(source[key]);
    collections[key] = optional[key] ? source[key] : [];
  }

  const slugs = new Set();
  for (const page of collections.pages) {
    const slug = String(page.slug || '').toLowerCase();
    assert(slug && !slugs.has(slug), 400, 'The backup contains duplicate page addresses.');
    slugs.add(slug);
  }

  return { collections, optional };
}

async function mergeAccounts(users) {
  const stats = { updated: 0, inserted: 0, remapped: 0 };
  const idMap = new Map();

  for (const incoming of users) {
    reviveDoc(incoming);
    const email = normalizeEmail(incoming.email);
    assert(email, 400, 'An account in the backup has no email address.');
    assert(
      /^\$2[aby]\$/.test(String(incoming.password || '')),
      400,
      'An account in the backup has an invalid password record.'
    );

    const fields = {
      name: String(incoming.name || 'Staff').slice(0, 80),
      email,
      role: incoming.role === 'superadmin' ? 'superadmin' : 'admin',
      permissions: sanitizePermissions(incoming.permissions),
      active: incoming.active !== false,
      avatar: typeof incoming.avatar === 'string' ? incoming.avatar : '',
      password: String(incoming.password),
      lastLogin: incoming.lastLogin || null,
      updatedAt: new Date(),
    };

    const existing = await User.collection.findOne({ email });
    if (existing) {
      // Keep the live activity timestamp so a restore cannot instantly expire
      // the session of whoever is signed in right now.
      await User.collection.updateOne({ _id: existing._id }, { $set: fields });
      idMap.set(String(incoming._id), String(existing._id));
      if (String(existing._id) !== String(incoming._id)) stats.remapped += 1;
      stats.updated += 1;
      continue;
    }

    const doc = {
      _id: incoming._id,
      ...fields,
      lastActiveAt: new Date(),
      createdAt: incoming.createdAt || new Date(),
    };
    try {
      await User.collection.insertOne(doc);
      idMap.set(String(incoming._id), String(incoming._id));
    } catch (error) {
      if (error?.code !== 11000) throw error;
      const conflict = await User.collection.findOne({ email });
      if (conflict) {
        await User.collection.updateOne({ _id: conflict._id }, { $set: fields });
        idMap.set(String(incoming._id), String(conflict._id));
        stats.remapped += 1;
        stats.updated += 1;
        continue;
      }
      // The backup id is already used by a different account; keep the email.
      const { _id, ...rest } = doc;
      const result = await User.collection.insertOne(rest);
      idMap.set(String(incoming._id), String(result.insertedId));
      stats.remapped += 1;
    }
    stats.inserted += 1;
  }

  return { stats, idMap };
}

function remapUserRefs(key, docs, idMap) {
  const field = USER_REF_FIELDS[key];
  if (!field) return;
  for (const doc of docs) {
    const current = doc[field];
    if (!current) continue;
    const mapped = idMap.get(String(current));
    if (mapped) doc[field] = new mongoose.Types.ObjectId(mapped);
  }
}

async function restoreFiles(archive) {
  const stats = { written: 0, skipped: 0 };
  if (!archive) return stats;

  for (const entry of archive.files) {
    if (entry.type !== 'File') continue;
    if (!UPLOAD_ENTRY_RE.test(entry.path)) {
      // data.json and other metadata are expected; only uploads-style paths
      // that fail the guard are worth reporting as skipped.
      if (/^uploads[\\/]/i.test(entry.path)) stats.skipped += 1;
      continue;
    }

    const name = path.basename(entry.path);
    if (name === '.' || name === '..') {
      stats.skipped += 1;
      continue;
    }

    const target = path.join(uploadDir, name);
    if (!target.startsWith(uploadDir + path.sep)) {
      stats.skipped += 1;
      continue;
    }

    await pipeline(entry.stream(), fs.createWriteStream(target));
    stats.written += 1;
  }

  return stats;
}

const receiveBackup = (req, res, next) => {
  backupUpload.single('file')(req, res, (error) => {
    if (!error) return next();
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'Backups larger than 1 GB are not supported.'
        : error.message || 'Could not read the uploaded backup.';
    next(new HttpError(400, message));
  });
};

router.post(
  '/restore',
  receiveBackup,
  asyncHandler(async (req, res) => {
    assert(req.file, 400, 'Please choose a backup file to restore.');

    try {
      const { payload, archive } = await readBackup(req.file);
      const { collections, optional } = validatePayload(payload);

      const incomingUsers = collections.users;
      const activeSuperadmins = incomingUsers.filter(
        (user) => user.role === 'superadmin' && user.active !== false
      );
      assert(
        activeSuperadmins.length > 0,
        400,
        'That backup has no active superadmin, so it cannot be restored safely.'
      );

      const emails = new Set();
      for (const user of incomingUsers) {
        const email = normalizeEmail(user.email);
        assert(email && !emails.has(email), 400, 'That backup contains duplicate account emails.');
        emails.add(email);
      }

      const { stats: accountStats, idMap } = await mergeAccounts(incomingUsers);
      const counts = {};

      for (const key of RESTORE_ORDER) {
        if (key === 'auditlogs' || key === 'pagevisits') {
          if (!optional[key]) continue;
        }

        const docs = collections[key] || [];
        for (const doc of docs) reviveDoc(doc);
        remapUserRefs(key, docs, idMap);

        const model = MODEL_BY_KEY.get(key);
        await model.collection.deleteMany({});
        if (docs.length) await model.collection.insertMany(docs, { ordered: false });
        counts[key] = docs.length;
      }

      let settingsRestored = false;
      const settingsDocs = collections.sitesettings;
      if (settingsDocs.length) {
        const site = settingsDocs.find((doc) => doc.key === 'site') || settingsDocs[0];
        reviveDoc(site);
        await SiteSettings.collection.deleteMany({});
        await SiteSettings.collection.insertOne({ ...site, key: site.key || 'site' });
        settingsRestored = true;
      }

      const fileStats = await restoreFiles(archive);

      let lockoutProtected = false;
      const survivingSuperadmins = await User.collection.countDocuments({
        role: 'superadmin',
        active: { $ne: false },
      });
      if (survivingSuperadmins === 0 && req.user?._id) {
        await User.collection.updateOne(
          { _id: req.user._id },
          { $set: { role: 'superadmin', active: true } }
        );
        lockoutProtected = true;
      }

      const warnings = [];
      if (process.env.VERCEL) {
        warnings.push(
          'Uploaded files are stored on temporary serverless storage and may disappear when the server restarts.'
        );
      }
      if (!archive) {
        warnings.push('This was a JSON backup, so uploaded files were not part of the restore.');
      }
      const empty = ['posts', 'pages', 'ministries', 'activities', 'givingoptions', 'comments'].filter(
        (key) => (collections[key] || []).length === 0
      );
      if (empty.length) {
        warnings.push(`Empty in the backup and may be reseeded automatically: ${empty.join(', ')}.`);
      }
      if (accountStats.remapped) {
        warnings.push(
          `${accountStats.remapped} account(s) were matched by email and kept their existing sign-in ids.`
        );
      }
      if (fileStats.skipped) {
        warnings.push(`${fileStats.skipped} archive entr${fileStats.skipped === 1 ? 'y was' : 'ies were'} skipped as unsafe.`);
      }
      if (lockoutProtected) {
        warnings.push('The current superadmin was kept active so the site cannot be locked out.');
      }
      if (!settingsRestored) {
        warnings.push('The backup had no site settings, so the current settings were kept.');
      }

      await recordAudit({
        req,
        action: 'restored',
        entity: 'backup',
        label: 'site backup',
        summary: 'restored the site from a backup',
      });

      res.json({
        ok: true,
        summary: {
          collections: counts,
          accounts: accountStats,
          files: fileStats,
          lockoutProtected,
          warnings,
        },
      });
    } finally {
      if (req.file?.path) {
        await fsp.rm(req.file.path, { force: true }).catch(() => {});
      }
    }
  })
);

export default router;
