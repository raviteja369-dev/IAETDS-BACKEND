import mongoose from 'mongoose';

const timelineEntrySchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    status: String,
    note: String,
    actorName: String,
  },
  { _id: true },
);

const incidentSchema = new mongoose.Schema(
  {
    incidentId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    summary: { type: String, default: '' },
    severity: {
      type: String,
      enum: ['sev1', 'sev2', 'sev3', 'sev4'],
      default: 'sev3',
      index: true,
    },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'high',
      index: true,
    },
    status: {
      type: String,
      enum: ['detected', 'investigating', 'identified', 'monitoring', 'resolved'],
      default: 'detected',
      index: true,
    },
    impact: {
      type: String,
      enum: ['site_down', 'major_degradation', 'partial', 'minor'],
      default: 'partial',
    },
    category: {
      type: String,
      enum: ['security', 'infrastructure', 'application', 'network', 'database'],
      default: 'infrastructure',
      index: true,
    },
    affectedServices: { type: [String], default: [] },
    affectedAssets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Asset' }],
    commander: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    commanderName: String,
    detectedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    rootCause: { type: String, default: '' },
    resolution: { type: String, default: '' },
    escalationLevel: { type: Number, default: 1 },
    timeline: { type: [timelineEntrySchema], default: [] },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const Incident = mongoose.model('Incident', incidentSchema);
