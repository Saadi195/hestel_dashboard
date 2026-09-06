# Architecture

## Overview

The Hostel Management System uses a **Modular Monolith** with **Feature-Based** organization and a clean **4-layer architecture**.

## Architectural Layers

```
┌─────────────────────────────────────────┐
│         PRESENTATION LAYER              │
│   app/ (pages), components/             │
│   - Next.js App Router pages            │
│   - Route Groups: (auth), (dashboard)   │
│   - DashboardShell, Sidebar, Header     │
│   - Shared: EmptyState, LoadingState    │
└─────────────────┬───────────────────────┘
                  │ calls
┌─────────────────▼───────────────────────┐
│         APPLICATION LAYER               │
│   features/*/actions/ (Server Actions)  │
│   features/*/services/ (Use Cases)      │
│   - signIn(), createResident()          │
│   - assignBed(), recordPayment()        │
│   - submitNotice(), approveCheckout()   │
└─────────────────┬───────────────────────┘
                  │ uses
┌─────────────────▼───────────────────────┐
│            DOMAIN LAYER                 │
│   domain/ (Pure Business Rules)         │
│   - NO React, NO Next.js, NO Supabase  │
│   - ResidentStatus state machine        │
│   - Notice period calculation (15 days) │
│   - Fine waiver rules                   │
│   - Checkout eligibility rules          │
│   - Deposit deduction rules             │
└─────────────────┬───────────────────────┘
                  │ persisted by
┌─────────────────▼───────────────────────┐
│        INFRASTRUCTURE LAYER             │
│   features/*/repositories/ (DB Access) │
│   lib/supabase/ (Supabase clients)      │
│   - ResidentRepository.getById()        │
│   - FineRepository.create()            │
│   - Supabase queries are ONLY here      │
└─────────────────────────────────────────┘
```

## Dependency Direction

```
Presentation → Application → Domain ← Infrastructure
```

- Presentation depends on Application
- Application depends on Domain
- Infrastructure depends on Domain (implements repository interfaces)
- Domain has NO dependencies on other layers

## Request Flow Example (Create Resident)

```
Browser Form
     ↓
Server Action (features/residents/actions/index.ts)
     ↓ validates with Zod
     ↓ checks permission (requirePermission)
     ↓
ResidentService (features/residents/services/resident-service.ts)
     ↓ enforces business rules
     ↓ uses domain/residents/rules.ts
     ↓
ResidentRepository (features/residents/repositories/resident-repository.ts)
     ↓
Supabase PostgreSQL
     ↓
Activity Log (records 'resident.created')
```

## Feature Module Structure

Each feature module owns its full vertical slice:

```
features/residents/
├── components/      # React components (ResidentTable, ResidentForm)
├── actions/         # Server Actions (createResident, updateResident)
├── services/        # Use cases (ResidentService)
├── repositories/    # Database access (ResidentRepository)
├── schemas/         # Zod validation schemas
├── types/           # TypeScript interfaces
└── utils/           # Feature-specific utilities
```

## Authorization Flow

```
Server Action
     ↓
requirePermission('residents.create')
     ↓
getCurrentUser() → checks session
     ↓
hasPermission(user.role, permission)
     ↓ (checks lib/auth/permissions.ts)
Allow or throw ForbiddenError
```

## Anti-Patterns to Avoid

❌ Supabase query in a component
❌ Business logic inside page.tsx
❌ Duplicate business rule in multiple places
❌ Service-role key in client-side code
❌ Financial calculation in the browser
❌ Schema change without migration
❌ Skipping permission check in Server Action
