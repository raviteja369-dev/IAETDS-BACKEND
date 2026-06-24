import { AuditLog } from '../models/AuditLog.js';

/**
 * Persists an audit trail entry for mutating requests. Fire-and-forget so it
 * never blocks the response. Attach via `auditAction('asset.update')`.
 */
export function auditAction(action) {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 400) return;
      AuditLog.create({
        action,
        actor: req.user?.id,
        actorEmail: req.user?.email,
        actorRole: req.user?.role,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { params: req.params, query: req.query },
      }).catch(() => {});
    });
    next();
  };
}
