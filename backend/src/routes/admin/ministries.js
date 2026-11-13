import { Router } from 'express';
import Ministry from '../../models/Ministry.js';
import { asyncHandler, assert, str, bool, num } from '../../utils/http.js';
import { toSlug, uniqueSlug } from '../../utils/slug.js';
import { cleanRichText } from '../../utils/richText.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const ministries = await Ministry.find().sort({ order: 1, name: 1 });
    res.json({ ministries });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const name = str(req.body.name, 120);
    assert(name.length >= 2, 400, 'Please enter the ministry name.');

    const ministry = await Ministry.create({
      name,
      slug: await uniqueSlug(Ministry, req.body.slug || toSlug(name)),
      tagline: str(req.body.tagline, 180),
      description: cleanRichText(req.body.description, 20000),
      image: str(req.body.image, 600),
      leader: str(req.body.leader, 120),
      schedule: str(req.body.schedule, 160),
      order: num(req.body.order, 0),
      published: bool(req.body.published, true),
    });

    res.status(201).json({ ministry });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const ministry = await Ministry.findById(req.params.id);
    assert(ministry, 404, 'That ministry could not be found.');

    if (req.body.name !== undefined) {
      const name = str(req.body.name, 120);
      assert(name.length >= 2, 400, 'Please enter the ministry name.');
      ministry.name = name;
    }
    if (req.body.slug !== undefined) {
      ministry.slug = await uniqueSlug(Ministry, req.body.slug || ministry.name, ministry._id);
    }
    for (const field of ['tagline', 'image', 'leader', 'schedule']) {
      if (req.body[field] !== undefined) ministry[field] = str(req.body[field], 600);
    }
    if (req.body.description !== undefined) {
      ministry.description = cleanRichText(req.body.description, 20000);
    }
    if (req.body.order !== undefined) ministry.order = num(req.body.order, 0);
    if (req.body.published !== undefined) ministry.published = bool(req.body.published, true);

    await ministry.save();
    res.json({ ministry });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const ministry = await Ministry.findByIdAndDelete(req.params.id);
    assert(ministry, 404, 'That ministry could not be found.');
    res.json({ ok: true });
  })
);

export default router;
