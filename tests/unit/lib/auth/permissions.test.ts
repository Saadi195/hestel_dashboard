import { describe, it, expect } from 'vitest';

import { hasPermission, hasAllPermissions, hasAnyPermission, Permission } from '@/lib/auth/permissions';
import { Role } from '@/lib/auth/roles';

describe('RBAC Permissions', () => {
  describe('OWNER', () => {
    it('has all permissions', () => {
      expect(hasPermission(Role.OWNER, Permission.SETTINGS_MANAGE)).toBe(true);
      expect(hasPermission(Role.OWNER, Permission.FINES_WAIVE)).toBe(true);
      expect(hasPermission(Role.OWNER, Permission.EMPLOYEES_MANAGE)).toBe(true);
      expect(hasPermission(Role.OWNER, Permission.RESIDENTS_DELETE)).toBe(true);
    });
  });

  describe('MANAGER', () => {
    it('can approve checkout', () => {
      expect(hasPermission(Role.MANAGER, Permission.CHECKOUT_APPROVE)).toBe(true);
    });

    it('can waive fines', () => {
      expect(hasPermission(Role.MANAGER, Permission.FINES_WAIVE)).toBe(true);
    });

    it('cannot manage settings', () => {
      expect(hasPermission(Role.MANAGER, Permission.SETTINGS_MANAGE)).toBe(false);
    });

    it('cannot manage employees', () => {
      expect(hasPermission(Role.MANAGER, Permission.EMPLOYEES_MANAGE)).toBe(false);
    });
  });

  describe('RECEPTIONIST', () => {
    it('can view residents', () => {
      expect(hasPermission(Role.RECEPTIONIST, Permission.RESIDENTS_VIEW)).toBe(true);
    });

    it('can check in residents', () => {
      expect(hasPermission(Role.RECEPTIONIST, Permission.CHECKIN_CREATE)).toBe(true);
    });

    it('cannot waive fines', () => {
      expect(hasPermission(Role.RECEPTIONIST, Permission.FINES_WAIVE)).toBe(false);
    });

    it('cannot approve checkout', () => {
      expect(hasPermission(Role.RECEPTIONIST, Permission.CHECKOUT_APPROVE)).toBe(false);
    });
  });

  describe('ACCOUNTANT', () => {
    it('can view and create payments', () => {
      expect(hasPermission(Role.ACCOUNTANT, Permission.PAYMENTS_VIEW)).toBe(true);
      expect(hasPermission(Role.ACCOUNTANT, Permission.PAYMENTS_CREATE)).toBe(true);
    });

    it('can view reports', () => {
      expect(hasPermission(Role.ACCOUNTANT, Permission.REPORTS_VIEW)).toBe(true);
    });

    it('cannot approve checkout', () => {
      expect(hasPermission(Role.ACCOUNTANT, Permission.CHECKOUT_APPROVE)).toBe(false);
    });
  });

  describe('MAINTENANCE', () => {
    it('can view rooms', () => {
      expect(hasPermission(Role.MAINTENANCE, Permission.ROOMS_VIEW)).toBe(true);
    });

    it('can update complaints', () => {
      expect(hasPermission(Role.MAINTENANCE, Permission.COMPLAINTS_UPDATE)).toBe(true);
    });

    it('cannot access payments', () => {
      expect(hasPermission(Role.MAINTENANCE, Permission.PAYMENTS_VIEW)).toBe(false);
    });
  });

  describe('Permission helpers', () => {
    it('hasAllPermissions returns true when all are present', () => {
      expect(
        hasAllPermissions(Role.OWNER, [Permission.SETTINGS_MANAGE, Permission.FINES_WAIVE]),
      ).toBe(true);
    });

    it('hasAllPermissions returns false when any is missing', () => {
      expect(
        hasAllPermissions(Role.RECEPTIONIST, [Permission.RESIDENTS_VIEW, Permission.FINES_WAIVE]),
      ).toBe(false);
    });

    it('hasAnyPermission returns true when at least one matches', () => {
      expect(
        hasAnyPermission(Role.RECEPTIONIST, [Permission.FINES_WAIVE, Permission.RESIDENTS_VIEW]),
      ).toBe(true);
    });
  });
});
