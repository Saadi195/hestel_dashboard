# Role-Based Access Control (RBAC) Specification & Authorization Matrix

## Overview
The Hostel Management System enforces strict Role-Based Access Control (RBAC) across both client-side UI routes and server-side operations (Server Actions, Application Services, and Database RLS policies).

---

## Roles & Responsibilities

| Role | Access Level | Primary Scope |
| :--- | :--- | :--- |
| **OWNER** | Super Administrator | Full un-restricted system access across all hostels, settings, employee management, financial operations, and audit logs. |
| **MANAGER** | Hostel Operational Admin | Full operational control over residents, room allocations, bed assignments, check-ins, notice period processing, fine waivers, and checkout approvals. |
| **RECEPTIONIST** | Front-Desk Operations | Front-desk guest/resident interactions, resident directory lookup, reservation check-ins, bed allocation checks, and visitor log updates. |
| **ACCOUNTANT** | Financial Operations | Financial ledger accounting, rent charge tracking, rent payment collection, deposit installment processing, deposit deductions, and financial reporting. |
| **MAINTENANCE** | Facilities Management | Maintenance ticket tracking, room & bed operational status updates (`AVAILABLE` / `MAINTENANCE`), and resident complaint resolution. |

---

## Detailed Authorization Matrix

| Permission String | Permission Description | OWNER | MANAGER | RECEPTIONIST | ACCOUNTANT | MAINTENANCE |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `residents.view` | View resident listings & details | ✅ | ✅ | ✅ | ✅ | ❌ |
| `residents.create` | Register new resident profile | ✅ | ✅ | ✅ | ❌ | ❌ |
| `residents.update` | Modify resident profile details | ✅ | ✅ | ✅ | ❌ | ❌ |
| `residents.delete` | Hard delete resident record | ✅ | ❌ | ❌ | ❌ | ❌ |
| `residents.suspend` | Suspend / reinstate resident | ✅ | ✅ | ❌ | ❌ | ❌ |
| `rooms.view` | View room catalog & status | ✅ | ✅ | ✅ | ✅ | ✅ |
| `rooms.create` | Create physical room | ✅ | ✅ | ❌ | ❌ | ❌ |
| `rooms.update` | Update room status/rate | ✅ | ✅ | ❌ | ❌ | ✅ |
| `beds.assign` | Allocate resident to bed | ✅ | ✅ | ✅ | ❌ | ❌ |
| `checkin.create` | Perform resident check-in | ✅ | ✅ | ✅ | ❌ | ❌ |
| `payments.view` | View rent charges & payments | ✅ | ✅ | ❌ | ✅ | ❌ |
| `payments.create` | Record rent payment | ✅ | ✅ | ❌ | ✅ | ❌ |
| `deposits.view` | View security deposit ledger | ✅ | ✅ | ❌ | ✅ | ❌ |
| `deposits.create` | Record deposit installment | ✅ | ✅ | ❌ | ✅ | ❌ |
| `deposits.deduct` | Execute deposit deduction | ✅ | ✅ | ❌ | ✅ | ❌ |
| `fines.view` | View disciplinary fines | ✅ | ✅ | ❌ | ✅ | ❌ |
| `fines.create` | Issue disciplinary fine | ✅ | ✅ | ❌ | ✅ | ❌ |
| `fines.waive` | Waive fine balance | ✅ | ✅ | ❌ | ❌ | ❌ |
| `notices.create` | Submit checkout notice | ✅ | ✅ | ✅ | ❌ | ❌ |
| `checkout.approve` | Approve checkout settlement | ✅ | ✅ | ❌ | ❌ | ❌ |
| `employees.manage` | Add/update employee roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| `complaints.update` | Update complaint status | ✅ | ✅ | ✅ | ❌ | ✅ |
| `settings.manage` | Modify hostel settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| `reports.view` | View operational analytics | ✅ | ✅ | ❌ | ✅ | ❌ |
| `activity_logs.view` | View audit logs | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## Server-Side Enforcement
Server-side authorization is strictly enforced via the `requirePermission(permission)` helper in `lib/auth/session.ts`:

```ts
export async function requirePermission(permission: PermissionType): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError('Authentication required');
  if (!hasPermission(user.role, permission)) {
    throw new ForbiddenError(`You do not have permission to perform this action. Required: ${permission}`);
  }
  return user;
}
```
