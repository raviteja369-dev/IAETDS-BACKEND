import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../config/rbac.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false, minlength: 8 },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.VIEWER,
      index: true,
    },
    department: { type: String, default: 'Operations' },
    title: { type: String, default: '' },
    avatarColor: { type: String, default: '#6366f1' },
    phone: { type: String, default: '' },
    status: {
      type: String,
      enum: ['active', 'suspended', 'invited'],
      default: 'active',
      index: true,
    },
    mfaEnabled: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
    lastActiveAt: { type: Date },
    refreshTokens: { type: [String], default: [], select: false },
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  return obj;
};

userSchema.virtual('initials').get(function initials() {
  return this.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
});

export const User = mongoose.model('User', userSchema);
