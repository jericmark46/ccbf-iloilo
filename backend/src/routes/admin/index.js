import { Router } from 'express';
import { requireRole, requirePermission } from '../../middleware/auth.js';
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
import announcementRouter from './announcement.js';
import backupRouter from './backup.js';

const router = Router();

// Visible to every signed-in staff member (dashboard and traffic report).
router.use('/stats', statsRouter);
router.use('/visits', visitsRouter);

// Content sections assigned per account by a superadmin.
router.use('/posts', requirePermission('posts'), postsRouter);
router.use('/comments', requirePermission('comments'), commentsRouter);
router.use('/pages', requirePermission('pages'), pagesRouter);
router.use('/ministries', requirePermission('ministries'), ministriesRouter);
router.use('/activities', requirePermission('activities'), activitiesRouter);
router.use('/giving', requirePermission('giving'), givingRouter);
router.use('/media', requirePermission('media'), mediaRouter);
router.use('/messages', requirePermission('messages'), messagesRouter);
router.use('/settings', requirePermission('settings'), settingsRouter);
// The update editor needs the category list; writes inside are superadmin-only.
router.use('/categories', requirePermission('posts'), categoriesRouter);

// Superadmin only
router.use('/nav', requireRole('superadmin'), navRouter);
router.use('/announcement', requireRole('superadmin'), announcementRouter);
router.use('/backup', requireRole('superadmin'), backupRouter);
router.use('/logs', logsRouter); // guards itself; read-only audit trail
router.use('/users', requireRole('superadmin'), usersRouter);

export default router;
