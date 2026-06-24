import { Router } from 'express';
import { crudFactory } from '../controllers/crudFactory.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { auditAction } from '../middleware/audit.js';

/**
 * Builds a standard authenticated, RBAC-protected, audited CRUD router.
 */
export function resourceRouter(Model, resource, crudOptions = {}) {
  const router = Router();
  const ctrl = crudFactory(Model, crudOptions);

  router.use(authenticate);

  router.get('/', requirePermission(`${resource}:read`), ctrl.list);
  router.get('/:id', requirePermission(`${resource}:read`), ctrl.getOne);
  router.post(
    '/',
    requirePermission(`${resource}:write`),
    auditAction(`${resource}.create`),
    ctrl.create,
  );
  router.patch(
    '/:id',
    requirePermission(`${resource}:write`),
    auditAction(`${resource}.update`),
    ctrl.update,
  );
  router.delete(
    '/:id',
    requirePermission(`${resource}:write`),
    auditAction(`${resource}.delete`),
    ctrl.remove,
  );

  return router;
}
