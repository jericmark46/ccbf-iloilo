import { Router } from 'express';
import { requireRole } from '../../middleware/auth.js';
import statsRouter from './stats.js';
import postsRouter from './posts.js';
import commentsRouter from './comments.js';
import pagesRouter from './pages.js';
import ministriesRouter from './ministries.js';
import activitiesRouter from './activities.js';
import givingRouter from './giving.js';
import mediaRouter from './media.js';
import messagesRouter from './messages.js';
import settingsRouter from './settings.js';
import navRouter from './nav.js';
import usersRouter from './users.js';

const router = Router();

// Both admins and superadmins
router.use('/stats', statsRouter);
router.use('/posts', postsRouter);
router.use('/comments', commentsRouter);
router.use('/pages', pagesRouter);
router.use('/ministries', ministriesRouter);
router.use('/activities', activitiesRouter);
router.use('/giving', givingRouter);
router.use('/media', mediaRouter);
router.use('/messages', messagesRouter);
router.use('/settings', settingsRouter);

// Superadmin only
router.use('/nav', requireRole('superadmin'), navRouter);
router.use('/users', requireRole('superadmin'), usersRouter);

export default router;
