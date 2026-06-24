import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
  {
    assetTag: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'server',
        'network',
        'storage',
        'endpoint',
        'database',
        'application',
        'cloud',
        'security_appliance',
        'iot',
      ],
      required: true,
      index: true,
    },
    type: { type: String, default: '' },
    manufacturer: { type: String, default: '' },
    model: { type: String, default: '' },
    serialNumber: { type: String, default: '' },
    status: {
      type: String,
      enum: ['operational', 'degraded', 'maintenance', 'offline', 'retired'],
      default: 'operational',
      index: true,
    },
    criticality: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
      index: true,
    },
    environment: {
      type: String,
      enum: ['production', 'staging', 'development', 'dr'],
      default: 'production',
    },
    location: { type: String, default: 'Primary Datacenter' },
    region: { type: String, default: 'us-east-1' },
    ipAddress: { type: String, default: '' },
    os: { type: String, default: '' },
    owner: { type: String, default: '' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    healthScore: { type: Number, min: 0, max: 100, default: 95 },
    purchaseDate: { type: Date },
    warrantyExpiry: { type: Date },
    lifecycleStage: {
      type: String,
      enum: ['procurement', 'deployed', 'in_use', 'end_of_life', 'retired'],
      default: 'in_use',
    },
    costMonthly: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
    lastSeenAt: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

assetSchema.index({ name: 'text', assetTag: 'text', model: 'text' });

export const Asset = mongoose.model('Asset', assetSchema);
