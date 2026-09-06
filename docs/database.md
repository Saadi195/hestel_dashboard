# Database Architecture & Field Classification

## Overview

PostgreSQL via Supabase. All database migrations are stored in `supabase/migrations/`.

## Core Conventions

- All primary keys are `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`.
- All timestamps use `TIMESTAMPTZ` with `created_at` and auto-managed `updated_at`.
- All major domain tables reference `hostel_id` for multi-hostel data isolation.
- Financial transaction records are **immutable** (`rent_payments`, `security_deposit_payments`, `fine_payments`).
- All tables have Row Level Security (RLS) policies enforcing hostel-level data isolation.
- Resident `cnic` is treated as sensitive PII and is masked in `residents_safe` view for general role queries.

---

## Field Classification Framework

Every field in the schema is explicitly classified into one of three architectural categories:

1. **`AUTHORITATIVE`**: The primary source of truth. Directly created and updated.
2. **`DERIVED`**: Computed dynamically on-the-fly from authoritative records. Never stored as editable database columns.
3. **`HISTORICAL SNAPSHOT`**: Frozen immutable financial record captured upon lifecycle finalization (e.g. checkout settlement approval).

### Field Classification Matrix

| Table / Concept | Field / Concept | Classification | Formula / Source of Truth |
|-----------------|-----------------|----------------|---------------------------|
| `residents` | `full_name`, `phone`, `cnic`, `status` | `AUTHORITATIVE` | Directly stored in `residents` table |
| `resident_assignments` | `bed_id`, `check_in_date`, `status` | `AUTHORITATIVE` | Source of truth for bed allocation |
| `rooms` | `room_number`, `capacity`, `monthly_rent`, `operational_status` | `AUTHORITATIVE` | Stored in `rooms` (`AVAILABLE`, `MAINTENANCE`) |
| `rooms` | Occupancy State (`EMPTY`, `PARTIALLY_OCCUPIED`, `FULLY_OCCUPIED`) | **`DERIVED`** | `COUNT(active_assignments)` vs `capacity` |
| `beds` | `bed_number`, `operational_status` | `AUTHORITATIVE` | Stored in `beds` (`AVAILABLE`, `MAINTENANCE`) |
| `beds` | Occupancy State (`UNASSIGNED`, `ASSIGNED`) | **`DERIVED`** | Computed from `resident_assignments` where `status = 'ACTIVE'` |
| `rent_charges` | `billing_period`, `amount`, `due_date` | `AUTHORITATIVE` | Stored in `rent_charges` |
| `rent_payments` | `amount`, `payment_date`, `payment_method` | `AUTHORITATIVE` | Immutable transaction record |
| Rent Status | `RentStatus` (`UNPAID`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`) | **`DERIVED`** | `charge.amount` vs `SUM(rent_payments.amount)` |
| `security_deposits` | `required_amount` | `AUTHORITATIVE` | Stored in `security_deposits` |
| `security_deposit_payments` | `amount`, `payment_date` | `AUTHORITATIVE` | Immutable transaction log |
| `security_deposit_deductions` | `reason`, `amount`, `approved_by` | `AUTHORITATIVE` | Stored deduction record |
| Deposit Balance | Deposit Paid / Refundable Deposit | **`DERIVED`** | `SUM(deposit_payments) - SUM(deposit_deductions)` |
| `fines` | `title`, `reason`, `amount`, `is_waived` | `AUTHORITATIVE` | Stored in `fines` (amount_paid REMOVED) |
| `fine_payments` | `amount`, `payment_date` | `AUTHORITATIVE` | Immutable transaction log |
| Fine Balance | Outstanding Fine Balance | **`DERIVED`** | `fines.amount - SUM(fine_payments.amount)` |
| `checkout_settlements` | `snapshot_total_rent_due`, `snapshot_total_fines_due`, `snapshot_deposit_paid`, `snapshot_refundable_amount` | **`HISTORICAL SNAPSHOT`** | Frozen snapshot calculated dynamically prior to approval, then stored immutably |

---

## Schema Summary by Migration

### Migration 0001: Initial Infrastructure
- `profiles` — extends `auth.users` with user roles (`OWNER`, `MANAGER`, `RECEPTIONIST`, `ACCOUNTANT`, `MAINTENANCE`).
- `hostel_settings` — key-value store for hostel policies (`notice_period_days`, `currency`, `rent_proration_policy`).
- `activity_logs` — audit logging trail.

### Migration 0002: Multi-Hostel Foundation
- `hostels` — multi-hostel support entity (`id`, `name`, `status`).
- Adds `hostel_id` foreign keys to `profiles` and `hostel_settings`.

### Migration 0003: Rooms, Beds, Residents, Assignments, Suspensions
- `rooms` — physical room records with `operational_status`.
- `beds` — bed records with `operational_status`.
- `residents` — resident personal details with `status` (`RESERVED`, `ACTIVE`, `NOTICE_PERIOD`, `CHECKOUT_PENDING`, `CHECKED_OUT`, `SUSPENDED`).
- `resident_assignments` — tracks active and historical bed allocations. Includes partial unique indexes preventing double-booking active beds.
- `resident_suspensions` — audit table tracking resident suspension reasons, start/end dates, and authorizers.

### Migration 0004: Authoritative Financial Transactions
- `rent_charges` & `rent_payments` — rent billing and transaction log.
- `security_deposits`, `security_deposit_payments`, & `security_deposit_deductions` — deposit installments & deductions.
- `fines` & `fine_payments` — fine issuance, waivers, and transaction payments.

### Migration 0005: Notices, Checkout Settlements, Operations
- `notices` — resident notice submissions (15-day notice calculation).
- `checkout_settlements` — final historical settlement snapshots upon checkout approval.
- `complaints`, `expenses`, `visitors` — operational support entities.

### Migration 0006: RLS Security, PII Masking, Query Indexes
- Row Level Security policies enforcing `hostel_id` isolation across all tables.
- `residents_safe` view masking CNIC field for non-management roles.
- Performance indexes on frequently queried columns (`hostel_id`, `resident_id`, `status`, `created_at`, `payment_date`).
