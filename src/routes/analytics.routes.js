import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import {
  getDashboard,
  getPerformance,
  getSecurityOverview,
} from '../controllers/analytics.controller.js';

const router = Router();
router.use(authenticate);

router.get('/dashboard', requirePermission('dashboard:read'), getDashboard);
router.get('/performance', requirePermission('performance:read'), getPerformance);
router.get('/security', requirePermission('security:read'), getSecurityOverview);

export default router;
