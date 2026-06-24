import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reportId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['security', 'asset', 'performance', 'compliance', 'incident', 'maintenance'],
      required: true,
      index: true,
    },
    description: { type: String, default: '' },
    framework: { type: String, default: '' },
    period: { type: String, default: 'Last 30 days' },
    format: { type: String, enum: ['pdf', 'csv', 'xlsx', 'json'], default: 'pdf' },
    status: {
      type: String,
      enum: ['generated', 'scheduled', 'processing', 'failed'],
      default: 'generated',
    },
    score: { type: Number, min: 0, max: 100 },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    generatedByName: String,
    fileSize: { type: String, default: '1.2 MB' },
    metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const Report = mongoose.model('Report', reportSchema);
