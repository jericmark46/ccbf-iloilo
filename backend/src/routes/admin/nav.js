import { Router } from 'express';
import NavLink from '../../models/NavLink.js';
import { asyncHandler, assert, str, bool, num } from '../../utils/http.js';
import { buildNavTree } from '../../utils/nav.js';

const router = Router();

async function nextOrder(parentId) {
  const last = await NavLink.findOne({ parent: parentId }).sort({ order: -1 });
  return last ? last.order + 1 : 0;
}

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const links = await NavLink.find().sort({ order: 1, createdAt: 1 });
    res.json({ tree: buildNavTree(links, { includeHidden: true }), links });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const label = str(req.body.label, 60);
    const href = str(req.body.href, 300);
    assert(label.length >= 1, 400, 'Please enter a label for the link.');
    assert(href.length >= 1, 400, 'Please enter a URL or path for the link.');

    let parentId = null;
    if (req.body.parent) {
      const parent = await NavLink.findById(req.body.parent);
      assert(parent, 400, 'The selected parent link no longer exists.');
      assert(!parent.parent, 400, 'Navigation supports two levels only.');
      parentId = parent._id;
    }

    const link = await NavLink.create({
      label,
      href,
      parent: parentId,
      order: req.body.order !== undefined ? num(req.body.order, 0) : await nextOrder(parentId),
      visible: bool(req.body.visible, true),
      external: bool(req.body.external),
      openInNewTab: bool(req.body.openInNewTab),
      description: str(req.body.description, 120),
    });

    res.status(201).json({ link });
  })
);

router.put(
  '/reorder',
  asyncHandler(async (req, res) => {
    const items = Array.isArray(req.body.items) ? req.body.items.slice(0, 100) : [];
    assert(items.length > 0, 400, 'No navigation items were provided.');

    const updates = items
      .filter((item) => item?.id)
      .map((item) => ({
        updateOne: {
          filter: { _id: item.id },
          update: { $set: { order: num(item.order, 0) } },
        },
      }));

    if (updates.length) await NavLink.bulkWrite(updates);
    res.json({ ok: true });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const link = await NavLink.findById(req.params.id);
    assert(link, 404, 'That navigation link could not be found.');

    if (req.body.label !== undefined) {
      const label = str(req.body.label, 60);
      assert(label.length >= 1, 400, 'Please enter a label for the link.');
      link.label = label;
    }
    if (req.body.href !== undefined) {
      const href = str(req.body.href, 300);
      assert(href.length >= 1, 400, 'Please enter a URL or path for the link.');
      link.href = href;
    }
    if (req.body.visible !== undefined) link.visible = bool(req.body.visible, true);
    if (req.body.external !== undefined) link.external = bool(req.body.external);
    if (req.body.openInNewTab !== undefined) link.openInNewTab = bool(req.body.openInNewTab);
    if (req.body.description !== undefined) link.description = str(req.body.description, 120);

    if (req.body.parent !== undefined) {
      const nextParent = req.body.parent || null;
      if (nextParent) {
        assert(String(nextParent) !== String(link._id), 400, 'A link cannot be its own parent.');
        const parent = await NavLink.findById(nextParent);
        assert(parent, 400, 'The selected parent link no longer exists.');
        assert(!parent.parent, 400, 'Navigation supports two levels only.');
        const hasChildren = await NavLink.exists({ parent: link._id });
        assert(!hasChildren, 400, 'Move or delete this link’s children before nesting it.');
        if (String(link.parent || '') !== String(nextParent)) {
          link.parent = parent._id;
          link.order = await nextOrder(parent._id);
        }
      } else if (link.parent) {
        link.parent = null;
        link.order = await nextOrder(null);
      }
    }

    await link.save();
    res.json({ link });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const link = await NavLink.findById(req.params.id);
    assert(link, 404, 'That navigation link could not be found.');
    await NavLink.deleteMany({ parent: link._id });
    await link.deleteOne();
    res.json({ ok: true });
  })
);

export default router;
