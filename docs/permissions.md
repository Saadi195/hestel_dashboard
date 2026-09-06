# Permissions

## Roles

| Role | Description |
|------|-------------|
| OWNER | Full access to everything |
| MANAGER | Full operational access, cannot manage settings or employees |
| RECEPTIONIST | Can check-in, check-out initiation, view residents |
| ACCOUNTANT | Can manage payments, deposits, fines, and reports |
| MAINTENANCE | Can view rooms and update complaints |

## Permission Matrix

| Permission | OWNER | MANAGER | RECEPTIONIST | ACCOUNTANT | MAINTENANCE |
|-----------|-------|---------|--------------|------------|-------------|
| residents.view | ✅ | ✅ | ✅ | ✅ | ❌ |
| residents.create | ✅ | ✅ | ✅ | ❌ | ❌ |
| residents.update | ✅ | ✅ | ❌ | ❌ | ❌ |
| residents.delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| rooms.view | ✅ | ✅ | ✅ | ❌ | ✅ |
| beds.assign | ✅ | ✅ | ✅ | ❌ | ❌ |
| checkin.create | ✅ | ✅ | ✅ | ❌ | ❌ |
| checkout.approve | ✅ | ✅ | ❌ | ❌ | ❌ |
| payments.create | ✅ | ✅ | ❌ | ✅ | ❌ |
| deposits.approve | ✅ | ✅ | ❌ | ❌ | ❌ |
| fines.waive | ✅ | ✅ | ❌ | ❌ | ❌ |
| employees.manage | ✅ | ❌ | ❌ | ❌ | ❌ |
| settings.manage | ✅ | ❌ | ❌ | ❌ | ❌ |
| reports.view | ✅ | ✅ | ❌ | ✅ | ❌ |

## Enforcement

Permissions are enforced at **two levels**:

1. **Server Action / Service level** — `requirePermission()` in `lib/auth/session.ts`
2. **Database level** — Supabase Row Level Security (RLS) policies

Never rely on frontend-only route protection.

## Usage in Server Actions

```typescript
import { requirePermission } from '@/lib/auth/session';
import { Permission } from '@/lib/auth/permissions';

export async function createFine(data: CreateFineInput) {
  const user = await requirePermission(Permission.FINES_CREATE);
  // user is guaranteed to be authenticated and have fines.create permission
  await fineService.create(data, user.id);
}
```
