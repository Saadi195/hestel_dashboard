/**
 * Application user roles.
 *
 * Defines the hierarchy of access levels in the hostel management system.
 * OWNER > MANAGER > RECEPTIONIST / ACCOUNTANT / MAINTENANCE
 */
export enum Role {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  RECEPTIONIST = 'RECEPTIONIST',
  ACCOUNTANT = 'ACCOUNTANT',
  MAINTENANCE = 'MAINTENANCE',
}

export type RoleType = keyof typeof Role;

/**
 * Role display names for UI presentation.
 */
export const ROLE_LABELS: Record<Role, string> = {
  [Role.OWNER]: 'Owner',
  [Role.MANAGER]: 'Manager',
  [Role.RECEPTIONIST]: 'Receptionist',
  [Role.ACCOUNTANT]: 'Accountant',
  [Role.MAINTENANCE]: 'Maintenance Staff',
};

/**
 * All available roles as an array.
 */
export const ALL_ROLES = Object.values(Role);
