import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import SiteSettings from '../models/SiteSettings.js';
import NavLink from '../models/NavLink.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Page from '../models/Page.js';
import Ministry from '../models/Ministry.js';
import Activity from '../models/Activity.js';
import GivingOption from '../models/GivingOption.js';
import ContactMessage from '../models/ContactMessage.js';
import PageVisit from '../models/PageVisit.js';
import { asyncHandler, assert, str, parsePagination, escapeRegex } from '../utils/http.js';
import { buildNavTree } from '../utils/nav.js';
import { visibleCategories } from '../utils/categories.js';
import { dayKey, visitorHash, isBot, normalizePath } from '../utils/visits.js';

const router = Router();

const commentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'You have posted several comments. Please take a short pause.' },
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'You have sent several messages. Please try again later.' },
});

const likeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many reactions. Please try again later.' },
});

// The website reports one view per page; this only guards against abuse.
const visitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many page views.' },
});

function startOfDay() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

router.get(
  '/bootstrap',
  asyncHandler(async (_req, res) => {
    const [settings, navLinks, posts, ministries, activities, giving, pages, categories] = await Promise.all([
      SiteSettings.findOne({ key: 'site' }),
      NavLink.find().sort({ order: 1, createdAt: 1 }),
      Post.find({ published: true }).sort({ pinned: -1, createdAt: -1 }).limit(6),
      Ministry.find({ published: true }).sort({ order: 1, name: 1 }),
      Activity.find({ published: true, startAt: { $gte: startOfDay() } })
        .sort({ startAt: 1 })
        .limit(6),
      GivingOption.find({ published: true }).sort({ order: 1 }),
      Page.find({ published: true }).select('slug title subtitle updatedAt').sort({ title: 1 }),
      visibleCategories(),
    ]);

    const settledSettings = settings || (await SiteSettings.create({ key: 'site' }));

    res.json({
      settings: settledSettings,
      nav: buildNavTree(navLinks),
      posts,
      ministries,
      activities,
      giving,
      pages,
      categories: categories.map((doc) => ({ id: doc.id, name: doc.name, slug: doc.slug })),
    });
  })
);

router.get(
  '/posts',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = { published: true };
    if (req.query.category && req.query.category !== 'All') {
      filter.category = str(req.query.category, 40);
    }
    if (req.query.q) {
      const q = new RegExp(escapeRegex(str(req.query.q, 80)), 'i');
      filter.$or = [{ title: q }, { content: q }];
    }

    const [items, total] = await Promise.all([
      Post.find(filter).sort({ pinned: -1, createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  })
);

router.get(
  '/posts/:id',
  asyncHandler(async (req, res) => {
    const post = await Post.findOne({ _id: req.params.id, published: true });
    assert(post, 404, 'That update could not be found.');
    res.json({ post });
  })
);

router.get(
  '/posts/:id/comments',
  asyncHandler(async (req, res) => {
    const comments = await Comment.find({ post: req.params.id, approved: true })
      .sort({ createdAt: 1 })
      .limit(200);
    res.json({ comments });
  })
);

router.post(
  '/posts/:id/comments',
  commentLimiter,
  asyncHandler(async (req, res) => {
    const post = await Post.findOne({ _id: req.params.id, published: true });
    assert(post, 404, 'That update could not be found.');

    const name = str(req.body.name, 60);
    const body = str(req.body.body, 1200);
    assert(name.length >= 2, 400, 'Please share your name.');
    assert(body.length >= 3, 400, 'Please write a short message.');

    const comment = await Comment.create({ post: post._id, name, body });
    await Post.updateOne({ _id: post._id }, { $inc: { commentCount: 1 } });

    res.status(201).json({ comment });
  })
);

router.post(
  '/posts/:id/like',
  likeLimiter,
  asyncHandler(async (req, res) => {
    const action = req.body.action === 'unlike' ? 'unlike' : 'like';
    const filter = action === 'unlike'
      ? { _id: req.params.id, published: true, likeCount: { $gt: 0 } }
      : { _id: req.params.id, published: true };
    const inc = { likeCount: action === 'unlike' ? -1 : 1 };

    const post = await Post.findOneAndUpdate(filter, { $inc: inc }, { new: true }).select('likeCount');
    assert(post, 404, 'That update could not be found.');
    res.json({ likeCount: post.likeCount });
  })
);

router.get(
  '/pages/:slug',
  asyncHandler(async (req, res) => {
    const page = await Page.findOne({ slug: req.params.slug, published: true });
    assert(page, 404, 'That page could not be found.');
    res.json({ page });
  })
);

router.get(
  '/ministries',
  asyncHandler(async (_req, res) => {
    const ministries = await Ministry.find({ published: true }).sort({ order: 1, name: 1 });
    res.json({ ministries });
  })
);

router.get(
  '/ministries/:slug',
  asyncHandler(async (req, res) => {
    const ministry = await Ministry.findOne({ slug: req.params.slug, published: true });
    assert(ministry, 404, 'That ministry could not be found.');
    res.json({ ministry });
  })
);

router.get(
  '/activities',
  asyncHandler(async (_req, res) => {
    const activities = await Activity.find({ published: true }).sort({ startAt: 1 });
    res.json({ activities });
  })
);

router.get(
  '/giving',
  asyncHandler(async (_req, res) => {
    const options = await GivingOption.find({ published: true }).sort({ order: 1 });
    res.json({ options });
  })
);

router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const q = str(req.query.q, 80);
    if (q.length < 2) return res.json({ results: [] });

    const regex = new RegExp(escapeRegex(q), 'i');
    const [posts, pages, ministries, activities] = await Promise.all([
      Post.find({ published: true, $or: [{ title: regex }, { content: regex }] })
        .sort({ createdAt: -1 })
        .limit(5),
      Page.find({ published: true, $or: [{ title: regex }, { content: regex }] }).limit(4),
      Ministry.find({ published: true, $or: [{ name: regex }, { description: regex }] }).limit(4),
      Activity.find({ published: true, $or: [{ title: regex }, { description: regex }] }).limit(4),
    ]);

    const results = [
      ...posts.map((p) => ({
        type: 'Update',
        title: p.title || 'Church update',
        subtitle: p.category,
        href: `/updates/${p.id}`,
      })),
      ...pages.map((p) => ({ type: 'Page', title: p.title, subtitle: p.subtitle, href: `/pages/${p.slug}` })),
      ...ministries.map((m) => ({ type: 'Ministry', title: m.name, subtitle: m.tagline, href: `/ministries/${m.slug}` })),
      ...activities.map((a) => ({
        type: 'Activity',
        title: a.title,
        subtitle: a.location,
        href: `/activities#${a.slug}`,
      })),
    ];

    res.json({ results });
  })
);

router.post(
  '/visit',
  visitLimiter,
  asyncHandler(async (req, res) => {
    const path = normalizePath(str(req.body.path, 200));
    // Admin screens and crawlers are not part of the public traffic report.
    if (path.startsWith('/admin') || isBot(req)) return res.json({ ok: true, skipped: true });

    await PageVisit.create({
      day: dayKey(),
      path,
      visitor: visitorHash(req),
    });
    res.status(201).json({ ok: true });
  })
);

router.post(
  '/contact',
  contactLimiter,
  asyncHandler(async (req, res) => {
    const name = str(req.body.name, 80);
    const email = str(req.body.email, 160).toLowerCase();
    const phone = str(req.body.phone, 40);
    const subject = str(req.body.subject, 160);
    const message = str(req.body.message, 4000);

    assert(name.length >= 2, 400, 'Please share your name.');
    assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 400, 'Please enter a valid email address.');
    assert(message.length >= 10, 400, 'Please write a message of at least 10 characters.');

    await ContactMessage.create({ name, email, phone, subject, message });
    res.status(201).json({ ok: true, message: 'Thank you — your message has been received. We will be in touch soon.' });
  })
);

export default router;
