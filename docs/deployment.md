# Production Deployment Guide — Hostel Management System

This document outlines the step-by-step procedure for deploying the Hostel Management System to a production environment using **Vercel** (or Next.js compatible node host) and **Supabase**.

---

## 1. Environment Variables Configuration

Ensure the following environment variables are set in your hosting platform (e.g. Vercel Project Settings → Environment Variables):

### Required Public Variables (Exposed to Client)
- `NEXT_PUBLIC_SUPABASE_URL`: `https://<your-supabase-project-ref>.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `<your-supabase-anon-key>`
- `NEXT_PUBLIC_APP_URL`: `https://<your-custom-domain.com>`
- `NEXT_PUBLIC_APP_NAME`: `Hostel Management System`

### Required Server-Side Variables (NEVER Expose to Client)
- `SUPABASE_SERVICE_ROLE_KEY`: `<your-supabase-service-role-key>`
- `LOG_LEVEL`: `info`

---

## 2. Supabase Production Setup

### Database & Migrations
Execute migrations sequentially via the Supabase Dashboard SQL Editor or via Supabase CLI:

```bash
# Apply migrations sequentially
1. 0001_initial_schema.sql
2. 0002_multi_hostel_schema.sql
3. 0003_notices_checkout_settlement.sql
4. 0004_rls_policies.sql
5. 0005_audit_logs.sql
6. 0006_domain_rules_and_functions.sql
```

### Initial Owner Creation
1. Go to **Supabase Dashboard → Authentication → Users → Add User**.
2. Create user with initial credentials (e.g. `owner@yourdomain.com`).
3. Set user profile role to `OWNER` in PostgreSQL:
   ```sql
   UPDATE public.profiles
   SET role = 'OWNER', hostel_id = '00000000-0000-0000-0000-000000000001'
   WHERE email = 'owner@yourdomain.com';
   ```

### Authentication Redirect URLs
In **Supabase Dashboard → Authentication → URL Configuration**:
- Site URL: `https://<your-custom-domain.com>`
- Redirect URLs: `https://<your-custom-domain.com>/login`, `https://<your-custom-domain.com>/dashboard`

---

## 3. Production Build & Verification

Before releasing, execute final validation checks locally or in CI/CD pipeline:

```bash
# 1. Production Build
npm run build

# 2. TypeScript Compilation Check
npx tsc --noEmit

# 3. Code Quality & Linting
npm run lint

# 4. Unit & Integration Tests
npx vitest run

# 5. End-to-End System Tests
npx playwright test
```

---

## 4. Health Check Endpoint

Verify system health post-deployment by querying:
`https://<your-custom-domain.com>/api/health`

Expected JSON response:
```json
{
  "status": "ok",
  "timestamp": "2026-09-06T15:00:00.000Z",
  "service": "hostel-management-api",
  "version": "0.1.0"
}
```

---

## 5. Rollback Considerations

If critical issues arise post-deployment:
1. Promote previous successful Vercel deployment build in Dashboard → Deployments → Promote to Production.
2. Database migrations are backward-compatible and preserve data integrity across schema versions.
