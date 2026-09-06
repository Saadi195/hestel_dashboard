import { Role } from './roles';

/**
 * Application permissions.
 *
 * Each permission follows the pattern: resource.action
 * These are checked server-side before performing any operation.
 */
export const Permission = {
  // Residents
  RESIDENTS_VIEW: 'residents.view',
  RESIDENTS_CREATE: 'residents.create',
  RESIDENTS_UPDATE: 'residents.update',
  RESIDENTS_DELETE: 'residents.delete',

  // Rooms
  ROOMS_VIEW: 'rooms.view',
  ROOMS_CREATE: 'rooms.create',
  ROOMS_UPDATE: 'rooms.update',

  // Beds
  BEDS_VIEW: 'beds.view',
  BEDS_ASSIGN: 'beds.assign',

  // Check-in / Check-out
  CHECKIN_VIEW: 'checkin.view',
  CHECKIN_CREATE: 'checkin.create',
  CHECKOUT_VIEW: 'checkout.view',
  CHECKOUT_CREATE: 'checkout.create',
  CHECKOUT_APPROVE: 'checkout.approve',

  // Payments
  PAYMENTS_VIEW: 'payments.view',
  PAYMENTS_CREATE: 'payments.create',
  PAYMENTS_UPDATE: 'payments.update',

  // Security Deposits
  DEPOSITS_VIEW: 'deposits.view',
  DEPOSITS_CREATE: 'deposits.create',
  DEPOSITS_APPROVE: 'deposits.approve',
  DEPOSITS_DEDUCT: 'deposits.deduct',

  // Fines
  FINES_VIEW: 'fines.view',
  FINES_CREATE: 'fines.create',
  FINES_UPDATE: 'fines.update',
  FINES_WAIVE: 'fines.waive',

  // Notices
  NOTICES_VIEW: 'notices.view',
  NOTICES_CREATE: 'notices.create',

  // Expenses
  EXPENSES_VIEW: 'expenses.view',
  EXPENSES_CREATE: 'expenses.create',
  EXPENSES_UPDATE: 'expenses.update',
  EXPENSES_DELETE: 'expenses.delete',

  // Complaints
  COMPLAINTS_VIEW: 'complaints.view',
  COMPLAINTS_UPDATE: 'complaints.update',

  // Visitors
  VISITORS_VIEW: 'visitors.view',
  VISITORS_CREATE: 'visitors.create',

  // Employees
  EMPLOYEES_VIEW: 'employees.view',
  EMPLOYEES_MANAGE: 'employees.manage',

  // Reports
  REPORTS_VIEW: 'reports.view',

  // Activity Logs
  ACTIVITY_LOGS_VIEW: 'activity_logs.view',

  // Settings
  SETTINGS_MANAGE: 'settings.manage',
} as const;

export type PermissionType = (typeof Permission)[keyof typeof Permission];

/**
 * Role-to-permissions mapping.
 *
 * This is the SINGLE SOURCE OF TRUTH for authorization.
 * All server-side permission checks must use this map.
 *
 * Row Level Security (RLS) in Supabase also uses these role names.
 */
export const ROLE_PERMISSIONS: Record<Role, PermissionType[]> = {
  [Role.OWNER]: Object.values(Permission), // Full access

  [Role.MANAGER]: [
    Permission.RESIDENTS_VIEW,
    Permission.RESIDENTS_CREATE,
    Permission.RESIDENTS_UPDATE,
    Permission.ROOMS_VIEW,
    Permission.ROOMS_CREATE,
    Permission.ROOMS_UPDATE,
    Permission.BEDS_VIEW,
    Permission.BEDS_ASSIGN,
    Permission.CHECKIN_VIEW,
    Permission.CHECKIN_CREATE,
    Permission.CHECKOUT_VIEW,
    Permission.CHECKOUT_CREATE,
    Permission.CHECKOUT_APPROVE,
    Permission.PAYMENTS_VIEW,
    Permission.PAYMENTS_CREATE,
    Permission.PAYMENTS_UPDATE,
    Permission.DEPOSITS_VIEW,
    Permission.DEPOSITS_CREATE,
    Permission.DEPOSITS_APPROVE,
    Permission.DEPOSITS_DEDUCT,
    Permission.FINES_VIEW,
    Permission.FINES_CREATE,
    Permission.FINES_UPDATE,
    Permission.FINES_WAIVE,
    Permission.NOTICES_VIEW,
    Permission.NOTICES_CREATE,
    Permission.EXPENSES_VIEW,
    Permission.EXPENSES_CREATE,
    Permission.EXPENSES_UPDATE,
    Permission.COMPLAINTS_VIEW,
    Permission.COMPLAINTS_UPDATE,
    Permission.VISITORS_VIEW,
    Permission.VISITORS_CREATE,
    Permission.EMPLOYEES_VIEW,
    Permission.REPORTS_VIEW,
    Permission.ACTIVITY_LOGS_VIEW,
  ],

  [Role.RECEPTIONIST]: [
    Permission.RESIDENTS_VIEW,
    Permission.RESIDENTS_CREATE,
    Permission.ROOMS_VIEW,
    Permission.BEDS_VIEW,
    Permission.BEDS_ASSIGN,
    Permission.CHECKIN_VIEW,
    Permission.CHECKIN_CREATE,
    Permission.CHECKOUT_VIEW,
    Permission.NOTICES_VIEW,
    Permission.NOTICES_CREATE,
    Permission.VISITORS_VIEW,
    Permission.VISITORS_CREATE,
    Permission.COMPLAINTS_VIEW,
    Permission.PAYMENTS_VIEW,
  ],

  [Role.ACCOUNTANT]: [
    Permission.RESIDENTS_VIEW,
    Permission.PAYMENTS_VIEW,
    Permission.PAYMENTS_CREATE,
    Permission.PAYMENTS_UPDATE,
    Permission.DEPOSITS_VIEW,
    Permission.DEPOSITS_CREATE,
    Permission.FINES_VIEW,
    Permission.FINES_CREATE,
    Permission.FINES_UPDATE,
    Permission.EXPENSES_VIEW,
    Permission.EXPENSES_CREATE,
    Permission.EXPENSES_UPDATE,
    Permission.REPORTS_VIEW,
  ],

  [Role.MAINTENANCE]: [
    Permission.ROOMS_VIEW,
    Permission.COMPLAINTS_VIEW,
    Permission.COMPLAINTS_UPDATE,
    Permission.VISITORS_VIEW,
  ],
};

/**
 * Checks whether a given role has a specific permission.
 *
 * @param role - The role to check
 * @param permission - The required permission
 * @returns true if the role has the permission
 */
export function hasPermission(role: Role, permission: PermissionType): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Checks whether a given role has ALL of the specified permissions.
 */
export function hasAllPermissions(role: Role, permissions: PermissionType[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Checks whether a given role has ANY of the specified permissions.
 */
export function hasAnyPermission(role: Role, permissions: PermissionType[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}
