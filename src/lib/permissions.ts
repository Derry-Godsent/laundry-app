export type PermissionLevel = 'view' | 'edit';

export const PAGE_PERMISSIONS: Record<string, Record<string, PermissionLevel>> = {
  '/dashboard': { admin: 'edit', gm: 'edit', manager: 'edit', staff: 'edit', courier: 'view' },
  '/new-order': { admin: 'edit', gm: 'edit', manager: 'edit', staff: 'edit', courier: 'view' },
  '/orders':    { admin: 'edit', gm: 'edit', manager: 'edit', staff: 'edit', courier: 'edit' },
  '/staff':     { admin: 'edit', gm: 'edit', manager: 'edit', staff: 'view', courier: 'view' },
  '/clients':   { admin: 'edit', gm: 'edit', manager: 'edit', staff: 'view', courier: 'view' },
  '/services':  { admin: 'edit', gm: 'edit', manager: 'edit', staff: 'view', courier: 'view' },
  '/receipt':   { admin: 'edit', gm: 'edit', manager: 'edit', staff: 'edit', courier: 'view' },
  '/payments':  { admin: 'edit', gm: 'edit', manager: 'edit', staff: 'view', courier: 'view' },
  '/security':  { admin: 'edit', gm: 'view', manager: 'view', staff: 'view', courier: 'view' },
  '/settings':  { admin: 'edit', gm: 'view', manager: 'view', staff: 'view', courier: 'view' },
  '/system':    { admin: 'edit', gm: 'view', manager: 'view', staff: 'view', courier: 'view' },
};

export const getUserPermission = (path: string, role: string): PermissionLevel => {
  return PAGE_PERMISSIONS[path]?.[role] || 'view';
};