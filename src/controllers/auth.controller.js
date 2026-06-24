import { z } from 'zod';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
} from '../utils/token.js';
import { ROLE_PERMISSIONS } from '../config/rbac.js';

export const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
    remember: z.boolean().optional(),
  }),
};

export const registerSchema = {
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.string().optional(),
    department: z.string().optional(),
    title: z.string().optional(),
  }),
};

export const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[a-z]/, 'Must include a lowercase letter')
      .regex(/[0-9]/, 'Must include a number'),
  }),
};

function issueTokens(user) {
  const payload = { sub: String(user._id), role: user.role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user || !(await user.comparePassword(password))) {
    await AuditLog.create({
      action: 'auth.login_failed',
      actorEmail: email,
      method: 'POST',
      path: '/api/auth/login',
      statusCode: 401,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (user.status === 'suspended') throw ApiError.forbidden('Account suspended');

  const { accessToken, refreshToken } = issueTokens(user);
  user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
  user.lastLoginAt = new Date();
  user.lastActiveAt = new Date();
  await user.save();

  await AuditLog.create({
    action: 'auth.login',
    actor: user._id,
    actorEmail: user.email,
    actorRole: user.role,
    method: 'POST',
    path: '/api/auth/login',
    statusCode: 200,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.cookie('iaetds_rt', refreshToken, refreshCookieOptions);
  res.json({
    success: true,
    data: {
      user: user.toSafeJSON(),
      accessToken,
      permissions: ROLE_PERMISSIONS[user.role] || [],
    },
  });
});

export const register = asyncHandler(async (req, res) => {
  const exists = await User.findOne({ email: req.body.email });
  if (exists) throw ApiError.conflict('Email already registered');
  const user = await User.create(req.body);
  res.status(201).json({ success: true, data: { user: user.toSafeJSON() } });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.iaetds_rt || req.body?.refreshToken;
  if (!token) throw ApiError.unauthorized('Refresh token missing');

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const user = await User.findById(decoded.sub).select('+refreshTokens');
  if (!user || !(user.refreshTokens || []).includes(token)) {
    throw ApiError.unauthorized('Refresh token revoked');
  }

  const tokens = issueTokens(user);
  user.refreshTokens = user.refreshTokens
    .filter((t) => t !== token)
    .concat(tokens.refreshToken)
    .slice(-5);
  user.lastActiveAt = new Date();
  await user.save();

  res.cookie('iaetds_rt', tokens.refreshToken, refreshCookieOptions);
  res.json({ success: true, data: { accessToken: tokens.accessToken } });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.iaetds_rt;
  if (token) {
    await User.updateMany(
      { refreshTokens: token },
      { $pull: { refreshTokens: token } },
    );
  }
  res.clearCookie('iaetds_rt', { ...refreshCookieOptions, maxAge: 0 });
  res.json({ success: true, data: { message: 'Logged out' } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password +refreshTokens');
  if (!user) throw ApiError.notFound('User not found');

  const valid = await user.comparePassword(currentPassword);
  if (!valid) throw ApiError.unauthorized('Current password is incorrect');

  const same = await user.comparePassword(newPassword);
  if (same) throw ApiError.badRequest('New password must differ from the current one');

  user.password = newPassword;
  // Invalidate all existing sessions except the current device for safety.
  const currentRt = req.cookies?.iaetds_rt;
  user.refreshTokens = currentRt ? [currentRt] : [];
  await user.save();

  await AuditLog.create({
    action: 'auth.password_changed',
    actor: user._id,
    actorEmail: user.email,
    actorRole: user.role,
    method: 'PATCH',
    path: '/api/auth/change-password',
    statusCode: 200,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.json({ success: true, data: { message: 'Password updated successfully' } });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.notFound('User not found');
  const unread = await Notification.countDocuments({ user: user._id, read: false });
  res.json({
    success: true,
    data: {
      user: user.toSafeJSON(),
      permissions: ROLE_PERMISSIONS[user.role] || [],
      unreadNotifications: unread,
    },
  });
});
