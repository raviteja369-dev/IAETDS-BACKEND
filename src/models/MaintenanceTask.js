import mongoose from 'mongoose';

const checklistItemSchema = new mongoose.Schema(
  { label: String, done: { type: Boolean, default: false } },
  { _id: true },
);

const maintenanceSchema = new mongoose.Schema(
  {
    workOrderId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: ['preventive', 'corrective', 'predictive', 'scheduled', 'emergency'],
      default: 'preventive',
      index: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'on_hold', 'completed', 'cancelled', 'overdue'],
      default: 'scheduled',
      index: true,
    },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
      index: true,
    },
    asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
    assetName: String,
    assignedTeam: { type: String, default: 'Infrastructure Ops' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assigneeName: String,
    scheduledStart: { type: Date },
    scheduledEnd: { type: Date },
    completedAt: { type: Date },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    estimatedHours: { type: Number, default: 2 },
    recurrence: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly', 'quarterly'],
      default: 'none',
    },
    checklist: { type: [checklistItemSchema], default: [] },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

export const MaintenanceTask = mongoose.model('MaintenanceTask', maintenanceSchema);
