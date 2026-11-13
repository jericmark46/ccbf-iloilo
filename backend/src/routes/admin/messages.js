import { Router } from 'express';
import ContactMessage from '../../models/ContactMessage.js';
import { asyncHandler, assert, bool, parsePagination } from '../../utils/http.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination({ ...req.query, limit: req.query.limit || 20 });
    const filter = {};
    if (req.query.unread === 'true') filter.read = false;

    const [items, total, unread] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ContactMessage.countDocuments(filter),
      ContactMessage.countDocuments({ read: false }),
    ]);

    res.json({ items, total, unread, page, pages: Math.max(1, Math.ceil(total / limit)) });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const message = await ContactMessage.findById(req.params.id);
    assert(message, 404, 'That message could not be found.');
    if (req.body.read !== undefined) message.read = bool(req.body.read, true);
    await message.save();
    res.json({ message });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);
    assert(message, 404, 'That message could not be found.');
    res.json({ ok: true });
  })
);

export default router;
