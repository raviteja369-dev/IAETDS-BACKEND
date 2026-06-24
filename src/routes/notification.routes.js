import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Notification } from '../models/Notification.js';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await Notification.find({ user: req.user.id })
      .sort('-createdAt')
      .limit(50)
      .lean();
    const unread = await Notification.countDocuments({ user: req.user.id, read: false });
    res.json({ success: true, data: items, meta: { unread } });
  }),
);

router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    await Notification.updateOne(
      { _id: req.params.id, user: req.user.id },
      { read: true },
    );
    res.json({ success: true, data: { id: req.params.id } });
  }),
);

router.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
    res.json({ success: true, data: { message: 'All marked read' } });
  }),
);

export default router;
