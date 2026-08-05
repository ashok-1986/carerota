/**
 * Shared authorization helpers for route handlers and server actions.
 * Centralizes the role allow-list checks that were previously inlined
 * (and sometimes missed) in individual routes.
 */

export const MANAGER_ROLES = ['home_manager', 'manager', 'admin'] as const;
export const PUBLISH_ROLES = ['home_manager', 'manager'] as const;

export type Role = string | null | undefined;

export function hasRole(role: Role, allowedRoles: readonly string[]): boolean {
  return !!role && allowedRoles.includes(role);
}

export function isManager(role: Role): boolean {
  return hasRole(role, MANAGER_ROLES);
}
