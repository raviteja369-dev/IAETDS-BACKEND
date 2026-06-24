import mongoose from 'mongoose';

const securityEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: [
        'intrusion_attempt',
        'malware',
        'phishing',
        'brute_force',
        'data_exfiltration',
        'policy_violation',
        'vulnerability',
        'anomaly',
        'failed_login',
        'privilege_escalation',
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low', 'info'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['new', 'triaging', 'investigating', 'contained', 'resolved', 'false_positive'],
      default: 'new',
      index: true,
    },
    riskScore: { type: Number, min: 0, max: 100, default: 50 },
    sourceIp: { type: String, default: '' },
    destinationIp: { type: String, default: '' },
    geoLocation: { type: String, default: '' },
    targetAsset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
    targetUser: { type: String, default: '' },
    mitreTactic: { type: String, default: '' },
    detectionSource: { type: String, default: 'SIEM' },
    cveId: { type: String, default: '' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    occurredAt: { type: Date, default: Date.now, index: true },
    resolvedAt: { type: Date },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const SecurityEvent = mongoose.model('SecurityEvent', securityEventSchema);
