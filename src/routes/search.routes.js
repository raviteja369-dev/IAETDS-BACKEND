import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { globalSearch } from '../controllers/search.controller.js';

/**
 * Global command-palette search. Results are scoped to the caller's
 * permissions inside the controller (per-collection), so only `authenticate`
 * is required here.
 */
const router = Router();

router.use(authenticate);
router.get('/', globalSearch);

export default router;
