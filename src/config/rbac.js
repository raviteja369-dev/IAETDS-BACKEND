/**
 * Role-Based Access Control matrix.
 * Roles map to a set of permission strings in the form `resource:action`.
 */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  SECURITY_ANALYST: 'security_analyst',
  MAINTENANCE_ENGINEER: 'maintenance_engineer',
  OPERATIONS_MANAGER: 'operations_manager',
  VIEWER: 'viewer',
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.SECURITY_ANALYST]: 'Security Analyst',
  [ROLES.MAINTENANCE_ENGINEER]: 'Maintenance Engineer',
  [ROLES.OPERATIONS_MANAGER]: 'Operations Manager',
  [ROLES.VIEWER]: 'Viewer',
};

const ALL = '*';

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [ALL],
  [ROLES.SECURITY_ANALYST]: [
    'dashboard:read',
    'assets:read',
    'security:read',
    'security:write',
    'incidents:read',
    'incidents:write',
    'reports:read',
    'performance:read',
    'notifications:read',
  ],
  [ROLES.MAINTENANCE_ENGINEER]: [
    'dashboard:read',
    'assets:read',
    'assets:write',
    'maintenance:read',
    'maintenance:write',
    'tickets:read',
    'tickets:write',
    'incidents:read',
    'performance:read',
    'notifications:read',
  ],
  [ROLES.OPERATIONS_MANAGER]: [
    'dashboard:read',
    'assets:read',
    'assets:write',
    'tickets:read',
    'tickets:write',
    'incidents:read',
    'incidents:write',
    'maintenance:read',
    'maintenance:write',
    'performance:read',
    'reports:read',
    'reports:write',
    'security:read',
    'notifications:read',
    'users:read',
  ],
  [ROLES.VIEWER]: [
    'dashboard:read',
    'assets:read',
    'security:read',
    'incidents:read',
    'maintenance:read',
    'performance:read',
    'reports:read',
    'notifications:read',
  ],
};

export function hasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role] || [];
  if (perms.includes(ALL)) return true;
  if (perms.includes(permission)) return true;
  // allow `resource:*` wildcards
  const [resource] = permission.split(':');
  return perms.includes(`${resource}:*`);
}
