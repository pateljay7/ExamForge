// Single source of truth for what can be permissioned.
// `create` on attempts means "take / submit an exam".
export const PERMISSION_CATALOG: {
  module: string;
  label: string;
  actions: string[];
}[] = [
  { module: 'exams', label: 'Exams', actions: ['view', 'create', 'edit', 'delete'] },
  { module: 'attempts', label: 'Exam Attempts', actions: ['view', 'create', 'delete'] },
  { module: 'roles', label: 'Roles', actions: ['view', 'create', 'edit', 'delete'] },
  { module: 'users', label: 'Users', actions: ['view', 'edit', 'delete'] },
];

export type Permissions = Record<string, Record<string, boolean>>;

// Build a full permission map with every action set to `value`.
export function buildPermissions(value: boolean): Permissions {
  const p: Permissions = {};
  for (const m of PERMISSION_CATALOG) {
    p[m.module] = {};
    for (const a of m.actions) p[m.module][a] = value;
  }
  return p;
}

// Keep only known module/action pairs, coerced to booleans.
export function sanitizePermissions(input: any): Permissions {
  const clean = buildPermissions(false);
  if (input && typeof input === 'object') {
    for (const m of PERMISSION_CATALOG) {
      for (const a of m.actions) {
        clean[m.module][a] = !!input?.[m.module]?.[a];
      }
    }
  }
  return clean;
}

export const ADMIN_PERMISSIONS = buildPermissions(true);

// "User": take exams + self-management only.
export const USER_PERMISSIONS: Permissions = {
  exams: { view: true, create: false, edit: false, delete: false },
  attempts: { view: true, create: true, delete: false },
  roles: { view: false, create: false, edit: false, delete: false },
  users: { view: false, edit: false, delete: false },
};

export function can(
  permissions: Permissions | null | undefined,
  perm: string,
): boolean {
  const [module, action] = perm.split(':');
  return !!permissions?.[module]?.[action];
}
