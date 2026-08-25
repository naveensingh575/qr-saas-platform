export type Role = 'OWNER' | 'ADMIN' | 'MEMBER';

export type Permission =
  | 'TEAM_MANAGE'
  | 'TEAM_INVITE'
  | 'API_KEY_CREATE'
  | 'API_KEY_REVOKE'
  | 'QR_CREATE'
  | 'QR_EDIT'
  | 'QR_DELETE'
  | 'BULK_GENERATE';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
    'TEAM_MANAGE',
    'TEAM_INVITE',
    'API_KEY_CREATE',
    'API_KEY_REVOKE',
    'QR_CREATE',
    'QR_EDIT',
    'QR_DELETE',
    'BULK_GENERATE',
  ],
  ADMIN: [
    'TEAM_INVITE',
    'API_KEY_CREATE',
    'QR_CREATE',
    'QR_EDIT',
    'QR_DELETE',
    'BULK_GENERATE',
  ],
  MEMBER: ['QR_CREATE', 'QR_EDIT'],
};

/**
 * Validates if a user role has the necessary permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const allowed = ROLE_PERMISSIONS[role];
  return allowed ? allowed.includes(permission) : false;
}

/**
 * Returns user hierarchy level (higher integer = higher authority)
 */
export function getRoleRank(role: Role): number {
  switch (role) {
    case 'OWNER':
      return 3;
    case 'ADMIN':
      return 2;
    case 'MEMBER':
      return 1;
    default:
      return 0;
  }
}
