import { Router } from 'express';
import UpdateCategory from '../../models/UpdateCategory.js';
import Post from '../../models/Post.js';
import { requireRole } from '../../middleware/auth.js';
import { asyncHandler, assert, str, bool, num, escapeRegex } from '../../utils/http.js';
import { ensureCategories, listCategories } from '../../utils/categories.js';
import { uniqueSlug } from '../../utils/slug.js';

const router = Router();

const MOVE_FALLBACK = 'General';

function cleanName(value) {
  const name = str(value, 40);
  assert(name.length >= 1, 400, 'Please give the category a name.');
  return name;
}

async function assertNameAvailable(name, excludeId = null) {
  const clash = await UpdateCategory.findOne({
    name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });
  assert(!clash, 409, `“${name}” is already a category.`);
}

// Admins can read the list (the update editor needs it); only superadmins can
// change it, matching who can open the Navigation screen.
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const [categories, counts] = await Promise.all([
      listCategories(),
      Post.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    ]);
    const usage = new Map(counts.map((row) => [row._id, row.count]));
    res.json({
      categories: categories.map((doc) => ({ ...doc.toJSON(), postCount: usage.get(doc.name) || 0 })),
    });
  })
);

router.post(
  '/',
  requireRole('superadmin'),
  asyncHandler(async (req, res) => {
    await ensureCategories();
    const name = cleanName(req.body.name);
    await assertNameAvailable(name);

    const last = await UpdateCategory.findOne().sort({ order: -1 });
    const category = await UpdateCategory.create({
      name,
      slug: await uniqueSlug(UpdateCategory, name),
      order: last ? last.order + 1 : 0,
      visible: bool(req.body.visible, true),
    });

    res.status(201).json({ category: { ...category.toJSON(), postCount: 0 } });
  })
);

router.put(
  '/reorder',
  requireRole('superadmin'),
  asyncHandler(async (req, res) => {
    const items = Array.isArray(req.body.items) ? req.body.items.slice(0, 100) : [];
    assert(items.length > 0, 400, 'No categories were provided.');

    const updates = items
      .filter((item) => item?.id)
      .map((item) => ({
        updateOne: {
          filter: { _id: item.id },
          update: { $set: { order: num(item.order, 0) } },
        },
      }));

    if (updates.length) await UpdateCategory.bulkWrite(updates);
    res.json({ ok: true });
  })
);

router.put(
  '/:id',
  requireRole('superadmin'),
  asyncHandler(async (req, res) => {
    const category = await UpdateCategory.findById(req.params.id);
    assert(category, 404, 'That category could not be found.');

    if (req.body.name !== undefined) {
      const name = cleanName(req.body.name);
      if (name !== category.name) {
        await assertNameAvailable(name, category._id);
        // Renames follow through to the updates already filed under the old name.
        await Post.updateMany({ category: category.name }, { $set: { category: name } });
        category.name = name;
        category.slug = await uniqueSlug(UpdateCategory, name, category._id);
      }
    }
    if (req.body.visible !== undefined) category.visible = bool(req.body.visible, true);
    if (req.body.order !== undefined) category.order = num(req.body.order, category.order);

    await category.save();
    const postCount = await Post.countDocuments({ category: category.name });
    res.json({ category: { ...category.toJSON(), postCount } });
  })
);

router.delete(
  '/:id',
  requireRole('superadmin'),
  asyncHandler(async (req, res) => {
    const categories = await listCategories();
    assert(categories.length > 1, 409, 'Keep at least one category so updates always have a home.');

    const category = categories.find((doc) => String(doc._id) === String(req.params.id));
    assert(category, 404, 'That category could not be found.');

    const remaining = categories.filter((doc) => String(doc._id) !== String(category._id));
    const target =
      remaining.find((doc) => doc.name === MOVE_FALLBACK) ||
      remaining.find((doc) => doc.visible) ||
      remaining[0];

    const reassigned = await Post.countDocuments({ category: category.name });
    if (reassigned) {
      await Post.updateMany({ category: category.name }, { $set: { category: target.name } });
    }
    await category.deleteOne();

    res.json({ ok: true, reassigned, movedTo: target.name });
  })
);

export default router;
