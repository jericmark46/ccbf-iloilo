import { Router } from 'express';
import Post from '../../models/Post.js';
import Comment from '../../models/Comment.js';
import User from '../../models/User.js';
import Media from '../../models/Media.js';
import ContactMessage from '../../models/ContactMessage.js';
import Ministry from '../../models/Ministry.js';
import Activity from '../../models/Activity.js';
import { asyncHandler } from '../../utils/http.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const [
      posts,
      publishedPosts,
      comments,
      users,
      media,
      unreadMessages,
      ministries,
      activities,
      recentPosts,
      recentComments,
      upcomingActivities,
    ] = await Promise.all([
      Post.countDocuments(),
      Post.countDocuments({ published: true }),
      Comment.countDocuments(),
      User.countDocuments(),
      Media.countDocuments(),
      ContactMessage.countDocuments({ read: false }),
      Ministry.countDocuments(),
      Activity.countDocuments(),
      Post.find().sort({ createdAt: -1 }).limit(4).select('title category published pinned createdAt'),
      Comment.find().sort({ createdAt: -1 }).limit(5).select('name body post createdAt'),
      Activity.find({ startAt: { $gte: new Date() } }).sort({ startAt: 1 }).limit(4),
    ]);

    res.json({
      totals: { posts, publishedPosts, comments, users, media, unreadMessages, ministries, activities },
      recentPosts,
      recentComments,
      upcomingActivities,
    });
  })
);

export default router;
