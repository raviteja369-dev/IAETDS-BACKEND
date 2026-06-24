import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuditLog } from '../models/AuditLog.js';
import { ROLES } from '../config/rbac.js';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  requireRole(ROLES.SUPER_ADMIN, ROLES.SECURITY_ANALYST, ROLES.OPERATIONS_MANAGER),
  asyncHandler(async (req, res) => {
    const limit = Math.min(200, parseInt(req.query.limit || '100', 10));
    const filter = {};
    if (req.query.action) filter.action = new RegExp(req.query.action, 'i');
    const items = await AuditLog.find(filter).sort('-createdAt').limit(limit).lean();
    res.json({ success: true, data: items });
  }),
);

export default router;
