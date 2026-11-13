import { Router } from 'express';
import { asyncHandler, str } from '../../utils/http.js';
import { monthlyVisitReport } from '../../utils/visits.js';

const router = Router();

// Any signed-in admin can see the traffic numbers; nothing here writes.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const month = str(req.query.month, 7);
    const report = await monthlyVisitReport(month);
    res.json(report);
  })
);

export default router;
