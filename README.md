# Hostel Management System

A production-ready hostel management system for hostel owners and employees. Built with Next.js 15, Supabase, and TypeScript.

## Overview

This application is an admin dashboard where hostel owners and authorized employees can manage:

- Residents (lifecycle: Reserved → Active → Notice Period → Checkout Pending → Checked Out)
- Rooms and Beds
- Check-in / Check-out
- Rent and Payments (PKR)
- Security Deposits (full or installment)
- Fines (with partial payment, waiver support)
- Notices (15-day configurable notice period)
- Expenses
- Complaints
- Visitors
- Employees (RBAC: Owner, Manager, Receptionist, Accountant, Maintenance)
- Reports
- Activity Logs (audit trail)

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.8 (strict mode) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Icons | Lucide React |
| Backend | Next.js Server Actions + Route Handlers |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Validation | Zod |
| Forms | React Hook Form + @hookform/resolvers |
| Data Fetching | Server Components (primary) + TanStack Query (client-side) |
| Unit Testing | Vitest + @testing-library/react |
| E2E Testing | Playwright |
| Linting | ESLint (next/core-web-vitals + @typescript-eslint) |
| Formatting | Prettier + prettier-plugin-tailwindcss |

## Architecture

Modular Monolith with Feature-Based organization and 4 architectural layers:

```
Presentation Layer  (app/ pages, components/)
        ↓
Application Layer   (features/*/actions, features/*/services)
        ↓
Domain Layer        (domain/ — pure business rules, no framework deps)
        ↓
Infrastructure Layer (features/*/repositories, lib/supabase)
```

See [docs/architecture.md](./docs/architecture.md) for full details.

## Folder Structure

```
hostel-management/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Auth route group (login)
│   └── (dashboard)/        # Protected dashboard routes
├── features/               # Feature modules (primary code location)
│   ├── auth/
│   ├── residents/
│   ├── rooms/
│   ├── beds/
│   ├── check-in/
│   ├── check-out/
│   ├── notices/
│   ├── payments/
│   ├── deposits/
│   ├── fines/
│   ├── expenses/
│   ├── complaints/
│   ├── visitors/
│   ├── employees/
│   ├── reports/
│   └── activity-logs/
├── components/             # Shared UI components
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Sidebar, Header, DashboardShell
│   └── shared/             # EmptyState, LoadingState, ErrorState
├── lib/                    # Infrastructure utilities
│   ├── supabase/           # Supabase clients (browser, server, middleware)
│   ├── auth/               # RBAC roles, permissions, session
│   ├── errors/             # Error classes + centralized handler
│   ├── validation/         # Shared Zod schemas
│   └── utils/              # date, currency (PKR), formatting
├── domain/                 # Business rules (no framework dependencies)
│   ├── residents/          # Status transitions, value objects
│   ├── rooms/
│   ├── notices/            # 15-day notice period calculation
│   ├── fines/
│   ├── payments/
│   ├── deposits/
│   └── checkout/
├── infrastructure/         # Cross-cutting infrastructure
├── supabase/               # Migrations, seed, config
│   └── migrations/
├── tests/
│   ├── unit/               # Vitest unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # Playwright E2E tests
└── docs/                   # Architecture documentation
```

## Local Setup

### Prerequisites

- Node.js 20+
- npm 10+
- Supabase account (or local Supabase CLI)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd hostel-management

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

## Environment Variables

Create `.env.local` from `.env.example`:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://lorxbxobtojhsrjrspwk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# Server-only (NEVER expose to browser)
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Hostel Management System

# Logging
LOG_LEVEL=info
```

## Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy your Project URL and Anon Key to `.env.local`
3. Run the initial migration:

```bash
# Option 1: Via Supabase Dashboard
# Go to SQL Editor and paste the contents of:
# supabase/migrations/0001_initial_schema.sql

# Option 2: Via Supabase CLI (requires supabase CLI installed)
npm run db:migrate
```

4. Create the first owner account:
   - Go to Supabase Dashboard → Authentication → Users → Invite user
   - Update the profile role: `UPDATE public.profiles SET role = 'OWNER' WHERE email = 'owner@example.com';`

## Development Commands

```bash
# Start development server
npm run dev

# Type check (no emit)
npm run type-check

# Lint
npm run lint
npm run lint:fix

# Format
npm run format
npm run format:check
```

## Testing Commands

```bash
# Unit tests
npm run test

# Unit tests in watch mode
npm run test:watch

# Unit tests with coverage
npm run test:coverage

# E2E tests (requires running dev server)
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

## Database Commands

```bash
# Push migrations to Supabase (requires Supabase CLI)
npm run db:migrate

# Reset local database
npm run db:reset

# Generate TypeScript types from schema
npm run db:types
```

## Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Set all environment variables in Vercel dashboard
4. Deploy — Next.js App Router works natively on Vercel

## Architectural Rules

1. **No Supabase queries in components** — always go through Server Actions → Service → Repository
2. **No business logic in pages** — pages compose feature components
3. **Domain layer has zero framework dependencies** — pure TypeScript only
4. **Financial calculations happen server-side** — never trust browser-submitted amounts
5. **All env secrets stay server-side** — `SUPABASE_SERVICE_ROLE_KEY` never in client code
6. **Centralized business rules** — e.g., `notice_period_days` is in `domain/notices/rules.ts`, not scattered
7. **Use migrations** — never manually modify production schema
8. **Audit logs** — all important operations generate activity_logs records

See [docs/architecture.md](./docs/architecture.md) for the full architectural guide.
