import { Router } from 'express';
import GivingOption from '../../models/GivingOption.js';
import { asyncHandler, assert, str, bool, num } from '../../utils/http.js';
import { toSlug } from '../../utils/slug.js';
import { cleanRichText } from '../../utils/richText.js';

const router = Router();
const METHODS = ['gcash', 'bank', 'paypal', 'cash', 'in-person', 'other'];

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const options = await GivingOption.find().sort({ order: 1 });
    res.json({ options });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const title = str(req.body.title, 120);
    assert(title.length >= 2, 400, 'Please enter a giving option title.');

    const option = await GivingOption.create({
      title,
      anchor: toSlug(req.body.anchor || title),
      method: METHODS.includes(req.body.method) ? req.body.method : 'other',
      description: str(req.body.description, 400),
      accountName: str(req.body.accountName, 120),
      accountNumber: str(req.body.accountNumber, 80),
      instructions: cleanRichText(req.body.instructions, 4000),
      image: str(req.body.image, 600),
      order: num(req.body.order, 0),
      published: bool(req.body.published, true),
    });

    res.status(201).json({ option });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const option = await GivingOption.findById(req.params.id);
    assert(option, 404, 'That giving option could not be found.');

    if (req.body.title !== undefined) {
      const title = str(req.body.title, 120);
      assert(title.length >= 2, 400, 'Please enter a giving option title.');
      option.title = title;
    }
    if (req.body.anchor !== undefined) option.anchor = toSlug(req.body.anchor || option.title);
    if (req.body.method !== undefined && METHODS.includes(req.body.method)) option.method = req.body.method;
    if (req.body.description !== undefined) option.description = str(req.body.description, 400);
    if (req.body.accountName !== undefined) option.accountName = str(req.body.accountName, 120);
    if (req.body.accountNumber !== undefined) option.accountNumber = str(req.body.accountNumber, 80);
    if (req.body.instructions !== undefined) option.instructions = cleanRichText(req.body.instructions, 4000);
    if (req.body.image !== undefined) option.image = str(req.body.image, 600);
    if (req.body.order !== undefined) option.order = num(req.body.order, 0);
    if (req.body.published !== undefined) option.published = bool(req.body.published, true);

    await option.save();
    res.json({ option });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const option = await GivingOption.findByIdAndDelete(req.params.id);
    assert(option, 404, 'That giving option could not be found.');
    res.json({ ok: true });
  })
);

export default router;
