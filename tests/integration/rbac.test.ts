import { describe, it, expect } from 'vitest';

import { hasPermission, Permission } from '@/lib/auth/permissions';
import { Role } from '@/lib/auth/roles';

describe('RBAC Authorization Matrix Integration', () => {
  it('OWNER has complete administrative access across all domain permissions', () => {
    Object.values(Permission).forEach((perm) => {
      expect(hasPermission(Role.OWNER, perm)).toBe(true);
    });
  });

  it('MANAGER has operational access but lacks system settings & employee management permissions', () => {
    expect(hasPermission(Role.MANAGER, Permission.RESIDENTS_CREATE)).toBe(true);
    expect(hasPermission(Role.MANAGER, Permission.ROOMS_CREATE)).toBe(true);
    expect(hasPermission(Role.MANAGER, Permission.CHECKOUT_APPROVE)).toBe(true);
    expect(hasPermission(Role.MANAGER, Permission.FINES_WAIVE)).toBe(true);

    expect(hasPermission(Role.MANAGER, Permission.SETTINGS_MANAGE)).toBe(false);
    expect(hasPermission(Role.MANAGER, Permission.EMPLOYEES_MANAGE)).toBe(false);
  });

  it('RECEPTIONIST has front-desk permissions only', () => {
    expect(hasPermission(Role.RECEPTIONIST, Permission.RESIDENTS_VIEW)).toBe(true);
    expect(hasPermission(Role.RECEPTIONIST, Permission.CHECKIN_CREATE)).toBe(true);

    expect(hasPermission(Role.RECEPTIONIST, Permission.CHECKOUT_APPROVE)).toBe(false);
    expect(hasPermission(Role.RECEPTIONIST, Permission.FINES_WAIVE)).toBe(false);
    expect(hasPermission(Role.RECEPTIONIST, Permission.SETTINGS_MANAGE)).toBe(false);
    expect(hasPermission(Role.RECEPTIONIST, Permission.EMPLOYEES_MANAGE)).toBe(false);
  });

  it('ACCOUNTANT has financial operations access only', () => {
    expect(hasPermission(Role.ACCOUNTANT, Permission.PAYMENTS_VIEW)).toBe(true);
    expect(hasPermission(Role.ACCOUNTANT, Permission.PAYMENTS_CREATE)).toBe(true);
    expect(hasPermission(Role.ACCOUNTANT, Permission.DEPOSITS_VIEW)).toBe(true);
    expect(hasPermission(Role.ACCOUNTANT, Permission.FINES_VIEW)).toBe(true);

    expect(hasPermission(Role.ACCOUNTANT, Permission.CHECKOUT_APPROVE)).toBe(false);
    expect(hasPermission(Role.ACCOUNTANT, Permission.RESIDENTS_CREATE)).toBe(false);
    expect(hasPermission(Role.ACCOUNTANT, Permission.ROOMS_CREATE)).toBe(false);
  });

  it('MAINTENANCE has facilities access only', () => {
    expect(hasPermission(Role.MAINTENANCE, Permission.ROOMS_VIEW)).toBe(true);
    expect(hasPermission(Role.MAINTENANCE, Permission.COMPLAINTS_UPDATE)).toBe(true);

    expect(hasPermission(Role.MAINTENANCE, Permission.PAYMENTS_VIEW)).toBe(false);
    expect(hasPermission(Role.MAINTENANCE, Permission.RESIDENTS_CREATE)).toBe(false);
    expect(hasPermission(Role.MAINTENANCE, Permission.SETTINGS_MANAGE)).toBe(false);
  });
});
