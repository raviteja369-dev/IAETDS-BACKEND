import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  login,
  register,
  refresh,
  logout,
  me,
  changePassword,
  loginSchema,
  registerSchema,
  changePasswordSchema,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many auth attempts, try later.' } },
});

router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.patch(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  changePassword,
);

export default router;
