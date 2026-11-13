import slugify from 'slugify';
import crypto from 'node:crypto';

export function toSlug(value, fallback = 'item') {
  const slug = slugify(String(value || ''), { lower: true, strict: true, trim: true });
  return slug || fallback;
}

export async function uniqueSlug(Model, value, excludeId = null) {
  const base = toSlug(value);
  let candidate = base;
  let attempt = 0;
  while (await Model.exists({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    attempt += 1;
    candidate = `${base}-${attempt < 4 ? attempt : crypto.randomBytes(3).toString('hex')}`;
  }
  return candidate;
}
