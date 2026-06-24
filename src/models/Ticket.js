import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: String,
    body: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const ticketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true, index: true },
    subject: { type: String, required: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['incident', 'request', 'problem', 'change', 'access'],
      default: 'request',
      index: true,
    },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'on_hold', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requesterName: String,
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assigneeName: String,
    relatedAsset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
    slaDueAt: { type: Date },
    slaBreached: { type: Boolean, default: false },
    resolvedAt: { type: Date },
    comments: { type: [commentSchema], default: [] },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const Ticket = mongoose.model('Ticket', ticketSchema);
