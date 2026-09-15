export const REQUIRE_PERMISSION_KEY = 'require_permission';

export const RBAC_RESOURCES = {
  EMAIL: 'email',
  USERS: 'users',
  FILES_LIST: 'files-list',
  MY_FILES: 'my-files',
  ME: 'me',
  PERMISSIONS: 'permissions',
} as const;

export const RBAC_ACTIONS = {
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
} as const;

export const RBAC_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type RequiredPermission = {
  permission: string;
  action: string;
};
