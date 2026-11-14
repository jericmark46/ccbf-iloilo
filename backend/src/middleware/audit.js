import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.js';
import Post from '../models/Post.js';
import Page from '../models/Page.js';
import Ministry from '../models/Ministry.js';
import Activity from '../models/Activity.js';
import GivingOption from '../models/GivingOption.js';
import Media from '../models/Media.js';
import Comment from '../models/Comment.js';
import NavLink from '../models/NavLink.js';
import UpdateCategory from '../models/UpdateCategory.js';
import User from '../models/User.js';
import ContactMessage from '../models/ContactMessage.js';

// Everything the admin API can change, described in words a person would use.
const ENTITIES = {
  posts: { singular: 'update', plural: 'updates', model: Post },
  pages: { singular: 'page', plural: 'pages', model: Page },
  ministries: { singular: 'ministry', plural: 'ministries', model: Ministry },
  activities: { singular: 'activity', plural: 'activities', model: Activity },
  giving: { singular: 'giving option', plural: 'giving options', model: GivingOption },
  media: { singular: 'media file', plural: 'media library', model: Media },
  comments: { singular: 'comment', plural: 'comments', model: Comment },
  messages: { singular: 'message', plural: 'inbox', model: ContactMessage },
  settings: { singular: 'site setting', plural: 'site settings', model: null },
  announcement: { singular: 'special announcement', plural: 'special announcements', model: null },
  nav: { singular: 'navigation link', plural: 'navigation links', model: NavLink },
  categories: { singular: 'update category', plural: 'update categories', model: UpdateCategory },
  users: { singular: 'account', plural: 'staff accounts', model: User },
  auth: { singular: 'session', plural: 'sessions', model: null },
  backup: { singular: 'site backup', plural: 'site backups', model: null },
};

const LABEL_KEYS = ['title', 'name', 'label', 'email', 'subject'];
const BODY_KEYS = [
  'post',
  'page',
  'ministry',
  'activity',
  'option',
  'media',
  'comment',
  'link',
  'category',
  'user',
  'item',
  'message',
  'settings',
  'announcement',
];
// Free text and file lists would make the log unreadable.
const IGNORED_FIELDS = new Set(['media', 'content', 'body', 'message', 'token']);

const metaFor = (entity) => ENTITIES[entity] || { singular: entity, plural: entity, model: null };

const articleFor = (noun) => (/^[aeiou]/i.test(noun) ? 'an' : 'a');

/** `/api/admin/nav/reorder` → `{ entity: 'nav', id: '' }` */
function routeParts(url = '') {
  const path = url.split('?')[0];
  const segments = path.replace(/^\/api\/admin\/?/, '').split('/').filter(Boolean);
  const entity = segments[0] || 'system';
  const last = segments[segments.length - 1] || '';
  const entityId = mongoose.isValidObjectId(last) ? last : '';
  return { path, entity, entityId };
}

function resolveAction(method, path) {
  if (path.endsWith('/reorder')) return 'reordered';
  if (method === 'POST') return 'created';
  if (method === 'PUT' || method === 'PATCH') return 'updated';
  if (method === 'DELETE') return 'deleted';
  return 'changed';
}

function summarize(action, meta, label) {
  if (action === 'reordered') return `reordered the ${meta.plural}`;
  const base = `${action} ${articleFor(meta.singular)} ${meta.singular}`;
  return label ? `${base} “${label}”` : base;
}

function pickLabel(source) {
  if (!source || typeof source !== 'object') return '';
  for (const key of LABEL_KEYS) {
    if (typeof source[key] === 'string' && source[key].trim()) {
      return source[key].trim().slice(0, 120);
    }
  }
  return '';
}

function labelFromBody(body) {
  const direct = pickLabel(body);
  if (direct) return direct;
  if (!body || typeof body !== 'object') return '';
  for (const key of BODY_KEYS) {
    const value = body[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const label = pickLabel(value);
      if (label) return label;
    }
  }
  return '';
}

function fieldsFromBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return [];
  return Object.keys(body)
    .filter((key) => !key.startsWith('_') && body[key] !== undefined && !IGNORED_FIELDS.has(key))
    .slice(0, 8);
}

function clientIp(req) {
  return (
    req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    ''
  );
}

function actorOf(req) {
  const user = req.user;
  if (!user) return { id: null, name: 'Someone', email: '', role: '' };
  return { id: user._id || null, name: user.name || 'Unknown', email: user.email || '', role: user.role || '' };
}

function baseEntry(req, extra) {
  const actor = actorOf(req);
  return {
    actor: actor.id,
    actorName: actor.name,
    actorEmail: actor.email,
    actorRole: actor.role,
    method: req.method,
    path: (req.originalUrl || req.url || '').split('?')[0],
    ip: clientIp(req),
    userAgent: String(req.headers['user-agent'] || '').slice(0, 220),
    ...extra,
  };
}

/**
 * Records an entry manually, for changes that do not go through the admin
 * router (signing in, for example).
 */
export async function recordAudit({ req, action, entity, label = '', summary = '', fields = [] }) {
  try {
    const meta = metaFor(entity);
    await AuditLog.create(
      baseEntry(req, {
        action,
        entity,
        label,
        summary: summary || summarize(action, meta, label),
        fields,
        status: 200,
      })
    );
  } catch {
    // A logging failure must never break the request it is describing.
  }
}

/**
 * Keeps a record of every successful change made through /api/admin.
 *
 * The entry is written while the response is still being prepared (just before
 * it is flushed) so the write survives on serverless platforms, and a short
 * timeout keeps a slow database from holding a request open.
 */
export function auditTrail(req, res, next) {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();

  const { path, entity, entityId } = routeParts(req.originalUrl || req.url);

  // Backup routes log themselves: exports stream a file and restores report a
  // summary, so the automatic "created" wording would be misleading.
  if (path.startsWith('/api/admin/backup')) return next();

  const meta = metaFor(entity);

  // Deletes only return `{ ok: true }`, so note the label before it is gone.
  const primeLabel = async () => {
    if (method !== 'DELETE' || !meta.model || !entityId) return '';
    try {
      const doc = await meta.model.findById(entityId).select('title name label email subject').lean();
      return pickLabel(doc);
    } catch {
      return '';
    }
  };

  const originalJson = res.json.bind(res);
  let sent = false;

  res.json = function auditJson(payload) {
    if (sent) return originalJson(payload);
    sent = true;

    if (res.statusCode >= 400) return originalJson(payload);

    const action = resolveAction(method, path);
    const label = labelFromBody(payload) || req.__auditLabel || '';
    const entry = baseEntry(req, {
      action,
      entity,
      entityId,
      label,
      summary: summarize(action, meta, label),
      fields: fieldsFromBody(req.body),
      status: res.statusCode,
    });

    const write = AuditLog.create(entry).catch(() => {});
    let timer;
    const guard = new Promise((resolve) => {
      timer = setTimeout(resolve, 1200);
    });

    Promise.race([write, guard]).finally(() => {
      clearTimeout(timer);
      originalJson(payload);
    });
    return res;
  };

  primeLabel()
    .then((label) => {
      req.__auditLabel = label;
      next();
    })
    .catch(() => next());
}
