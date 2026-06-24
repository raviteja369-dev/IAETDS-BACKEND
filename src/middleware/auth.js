import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/token.js';
import { User } from '../models/User.js';

export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw ApiError.unauthorized('Authentication token required');

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub).lean();
    if (!user) throw ApiError.unauthorized('User no longer exists');
    if (user.status === 'suspended') throw ApiError.forbidden('Account suspended');

    req.user = {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Access token expired'));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid access token'));
    }
    next(err);
  }
}
