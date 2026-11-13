import { Router } from 'express';
import Page from '../../models/Page.js';
import { asyncHandler, assert, str, bool } from '../../utils/http.js';
import { toSlug, uniqueSlug } from '../../utils/slug.js';
import { cleanRichText } from '../../utils/richText.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const pages = await Page.find().sort({ title: 1 });
    res.json({ pages });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const title = str(req.body.title, 120);
    assert(title.length >= 2, 400, 'Please enter a page title.');

    const slug = await uniqueSlug(Page, req.body.slug || toSlug(title));
    const page = await Page.create({
      title,
      slug,
      subtitle: str(req.body.subtitle, 240),
      heroImage: str(req.body.heroImage, 600),
      content: cleanRichText(req.body.content, 50000),
      published: bool(req.body.published, true),
      updatedBy: req.user._id,
    });

    res.status(201).json({ page });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const page = await Page.findById(req.params.id);
    assert(page, 404, 'That page could not be found.');

    if (req.body.title !== undefined) {
      const title = str(req.body.title, 120);
      assert(title.length >= 2, 400, 'Please enter a page title.');
      page.title = title;
    }
    if (req.body.slug !== undefined) {
      page.slug = await uniqueSlug(Page, req.body.slug || page.title, page._id);
    }
    if (req.body.subtitle !== undefined) page.subtitle = str(req.body.subtitle, 240);
    if (req.body.heroImage !== undefined) page.heroImage = str(req.body.heroImage, 600);
    if (req.body.content !== undefined) page.content = cleanRichText(req.body.content, 50000);
    if (req.body.published !== undefined) page.published = bool(req.body.published, true);

    page.updatedBy = req.user._id;
    await page.save();
    res.json({ page });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const page = await Page.findByIdAndDelete(req.params.id);
    assert(page, 404, 'That page could not be found.');
    res.json({ ok: true });
  })
);

export default router;
