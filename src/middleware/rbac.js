import { ApiError } from '../utils/ApiError.js';
import { hasPermission } from '../config/rbac.js';

/** Require a specific permission (e.g. `assets:write`). */
export function requirePermission(permission) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!hasPermission(req.user.role, permission)) {
      return next(
        ApiError.forbidden(`Missing required permission: ${permission}`),
      );
    }
    next();
  };
}

/** Require one of the provided roles. */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient role privileges'));
    }
    next();
  };
}
