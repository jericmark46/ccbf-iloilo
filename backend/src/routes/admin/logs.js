import { Router } from 'express';
import AuditLog from '../../models/AuditLog.js';
import { requireRole } from '../../middleware/auth.js';
import { asyncHandler, str, escapeRegex } from '../../utils/http.js';

const router = Router();

const ACTIONS = ['created', 'updated', 'deleted', 'reordered', 'signed-in', 'signed-out'];

// The log is an audit trail, so it is read-only and superadmin-only.
router.use(requireRole('superadmin'));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const filter = {};
    const q = str(req.query.q, 80);
    if (q) {
      const regex = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ summary: regex }, { label: regex }, { actorName: regex }, { actorEmail: regex }];
    }
    const entity = str(req.query.entity, 40);
    if (entity && entity !== 'all') filter.entity = entity;
    const action = str(req.query.action, 20);
    if (action && action !== 'all') filter.action = action;
    if (req.query.actor) filter.actor = req.query.actor;

    const [items, total, entities, actions] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(filter),
      AuditLog.distinct('entity'),
      AuditLog.distinct('action'),
    ]);

    res.json({
      items,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      facets: {
        entities: entities.sort(),
        actions: actions.filter((value) => ACTIONS.includes(value)).sort(),
      },
    });
  })
);

export default router;
