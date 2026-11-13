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
import categoriesRouter from './categories.js';
import visitsRouter from './visits.js';
import logsRouter from './logs.js';
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
router.use('/visits', visitsRouter);
// Readable by every admin (the update editor needs it); writes are superadmin-only.
router.use('/categories', categoriesRouter);

// Superadmin only
router.use('/nav', requireRole('superadmin'), navRouter);
router.use('/logs', logsRouter); // guards itself; read-only audit trail
router.use('/users', requireRole('superadmin'), usersRouter);

export default router;
