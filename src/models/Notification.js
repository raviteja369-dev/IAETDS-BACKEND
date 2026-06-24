import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    type: {
      type: String,
      enum: ['security', 'incident', 'maintenance', 'system', 'asset', 'report'],
      default: 'system',
    },
    severity: {
      type: String,
      enum: ['critical', 'warning', 'info', 'success'],
      default: 'info',
    },
    read: { type: Boolean, default: false, index: true },
    actionUrl: { type: String, default: '' },
  },
  { timestamps: true },
);

export const Notification = mongoose.model('Notification', notificationSchema);
