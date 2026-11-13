import { Router } from 'express';
import Comment from '../../models/Comment.js';
import Post from '../../models/Post.js';
import { asyncHandler, assert, bool, parsePagination } from '../../utils/http.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination({ ...req.query, limit: req.query.limit || 20 });
    const filter = {};
    if (req.query.post) filter.post = req.query.post;

    const [items, total] = await Promise.all([
      Comment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Comment.countDocuments(filter),
    ]);

    const postIds = [...new Set(items.map((item) => String(item.post)))];
    const posts = await Post.find({ _id: { $in: postIds } }).select('title');
    const titles = new Map(posts.map((post) => [post.id, post.title || 'Untitled update']));

    res.json({
      items: items.map((item) => ({ ...item.toJSON(), postTitle: titles.get(String(item.post)) || 'Deleted update' })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.id);
    assert(comment, 404, 'That comment could not be found.');
    if (req.body.approved !== undefined) comment.approved = bool(req.body.approved, true);
    await comment.save();
    res.json({ comment });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.id);
    assert(comment, 404, 'That comment could not be found.');
    await comment.deleteOne();
    if (comment.approved) {
      await Post.updateOne({ _id: comment.post, commentCount: { $gt: 0 } }, { $inc: { commentCount: -1 } });
    }
    res.json({ ok: true });
  })
);

export default router;
