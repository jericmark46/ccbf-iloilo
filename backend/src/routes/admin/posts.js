import { Router } from 'express';
import mongoose from 'mongoose';
import Post from '../../models/Post.js';
import Comment from '../../models/Comment.js';
import { resolveCategoryName } from '../../utils/categories.js';
import { asyncHandler, assert, str, bool, parsePagination, escapeRegex } from '../../utils/http.js';
import { cleanRichText } from '../../utils/richText.js';
import { normalizeMediaItem } from '../../utils/videoProviders.js';

const router = Router();

function mediaList(value, existingHype = new Map()) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 8)
    .map((item) => {
      const url = str(item?.url, 600);
      if (!url) return null;

      const normalized = normalizeMediaItem({ url, type: item?.type });
      if (!normalized) {
        if (item?.type === 'video') {
          assert(
            false,
            400,
            'Videos must be an uploaded MP4/WEBM/MOV file or a YouTube, Google Drive, or Facebook link.'
          );
        }
        assert(false, 400, 'Please enter a valid image or video URL.');
      }

      const incomingId = item?._id || item?.id;
      const mediaId = mongoose.isValidObjectId(incomingId) ? String(incomingId) : '';
      return {
        url,
        ...normalized,
        ...(mediaId ? { _id: mediaId } : {}),
        hypeCount: mediaId ? existingHype.get(mediaId) || 0 : 0,
      };
    })
    .filter(Boolean);
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination({ ...req.query, limit: req.query.limit || 12 });
    const filter = {};
    if (req.query.category && req.query.category !== 'All') filter.category = req.query.category;
    if (req.query.status === 'draft') filter.published = false;
    if (req.query.status === 'published') filter.published = true;
    if (req.query.q) {
      const regex = new RegExp(escapeRegex(str(req.query.q, 80)), 'i');
      filter.$or = [{ title: regex }, { content: regex }];
    }

    const [items, total] = await Promise.all([
      Post.find(filter).sort({ pinned: -1, createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const content = cleanRichText(req.body.content, 20000);
    assert(content.length >= 3, 400, 'Please write the update before publishing.');

    const category = await resolveCategoryName(req.body.category);
    const post = await Post.create({
      title: str(req.body.title, 160),
      content,
      category,
      coverImage: str(req.body.coverImage, 600),
      media: mediaList(req.body.media),
      pinned: bool(req.body.pinned),
      published: bool(req.body.published, true),
      inNewsFeed: bool(req.body.inNewsFeed),
      author: req.user._id,
      authorName: req.user.name,
    });

    res.status(201).json({ post });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    assert(post, 404, 'That update could not be found.');

    if (req.body.title !== undefined) post.title = str(req.body.title, 160);
    if (req.body.content !== undefined) {
      const content = cleanRichText(req.body.content, 20000);
      assert(content.length >= 3, 400, 'Please write the update before saving.');
      post.content = content;
    }
    if (req.body.category !== undefined) {
      post.category = await resolveCategoryName(req.body.category, post.category);
    }
    if (req.body.coverImage !== undefined) post.coverImage = str(req.body.coverImage, 600);
    if (req.body.media !== undefined) {
      const hypeByMedia = new Map(
        (post.media || []).map((item) => [String(item._id), item.hypeCount || 0])
      );
      post.media = mediaList(req.body.media, hypeByMedia);
    }
    if (req.body.pinned !== undefined) post.pinned = bool(req.body.pinned);
    if (req.body.published !== undefined) post.published = bool(req.body.published, true);
    if (req.body.inNewsFeed !== undefined) post.inNewsFeed = bool(req.body.inNewsFeed);

    await post.save();
    res.json({ post });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    assert(post, 404, 'That update could not be found.');
    await Promise.all([Comment.deleteMany({ post: post._id }), post.deleteOne()]);
    res.json({ ok: true });
  })
);

export default router;
