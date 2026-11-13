import UpdateCategory, { DEFAULT_CATEGORY_NAMES } from '../models/UpdateCategory.js';
import Post from '../models/Post.js';
import { escapeRegex } from './http.js';
import { toSlug } from './slug.js';

// Seeding only needs to happen once per server instance; the list itself is
// re-read on every request so admin changes show up immediately.
let seeded = false;

async function createSafely(name, order) {
  const clean = String(name || '').trim().slice(0, 40);
  if (!clean) return null;
  try {
    return await UpdateCategory.create({
      name: clean,
      slug: toSlug(clean, `category-${order}`),
      order,
      visible: true,
    });
  } catch (error) {
    // Duplicate slug means another category already covers this name.
    if (error?.code === 11000) return null;
    throw error;
  }
}

/**
 * Guarantees the category collection is usable:
 * - a fresh database gets the church's default list;
 * - an existing database adopts any category name already set on updates, so
 *   upgrading never makes content disappear from the filters.
 */
export async function ensureCategories() {
  if (seeded) return;
  const existing = await UpdateCategory.find().select('name order');
  if (existing.length === 0) {
    for (const [index, name] of DEFAULT_CATEGORY_NAMES.entries()) {
      await createSafely(name, index);
    }
  }

  const known = new Set((await UpdateCategory.find().select('name')).map((doc) => doc.name.toLowerCase()));
  const used = await Post.distinct('category');
  let order = (await UpdateCategory.countDocuments()) + 1;
  for (const name of used) {
    const clean = String(name || '').trim();
    if (!clean || known.has(clean.toLowerCase())) continue;
    await createSafely(clean, order);
    order += 1;
  }

  seeded = true;
}

export async function listCategories() {
  await ensureCategories();
  return UpdateCategory.find().sort({ order: 1, name: 1 });
}

export async function visibleCategories() {
  await ensureCategories();
  return UpdateCategory.find({ visible: true }).sort({ order: 1, name: 1 });
}

/** Maps whatever a client sent onto a stored category name. */
export async function resolveCategoryName(value, fallback = '') {
  await ensureCategories();
  const raw = String(value || '').trim().slice(0, 40);
  if (raw) {
    const match = await UpdateCategory.findOne({ name: new RegExp(`^${escapeRegex(raw)}$`, 'i') });
    if (match) return match.name;
  }
  if (fallback) return fallback;
  const first = await UpdateCategory.findOne().sort({ order: 1, name: 1 });
  return first ? first.name : DEFAULT_CATEGORY_NAMES[0];
}
