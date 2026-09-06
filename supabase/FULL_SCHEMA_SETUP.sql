-- ============================================================
-- Migration: 0001_initial_schema.sql
-- Description: Initial schema for Hostel Management System
-- ============================================================
-- Tables: profiles, hostel_settings, activity_logs
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE public.user_role AS ENUM (
    'OWNER',
    'MANAGER',
    'RECEPTIONIST',
    'ACCOUNTANT',
    'MAINTENANCE'
);

CREATE TYPE public.resident_status AS ENUM (
    'RESERVED',
    'ACTIVE',
    'NOTICE_PERIOD',
    'CHECKOUT_PENDING',
    'CHECKED_OUT'
);

CREATE TYPE public.fine_status AS ENUM (
    'UNPAID',
    'PARTIALLY_PAID',
    'PAID',
    'WAIVED'
);

-- ============================================================
-- PROFILES
-- Extends auth.users with hostel-specific employee data.
-- ============================================================

CREATE TABLE public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    name        TEXT,
    role        public.user_role NOT NULL DEFAULT 'RECEPTIONIST',
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automatically create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'name',
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'RECEPTIONIST')
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- HOSTEL SETTINGS
-- Key-value store for configurable settings.
-- e.g., notice_period_days = 15
-- ============================================================

CREATE TABLE public.hostel_settings (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key         TEXT NOT NULL UNIQUE,
    value       TEXT NOT NULL,
    description TEXT,
    updated_by  UUID REFERENCES public.profiles(id),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default settings
INSERT INTO public.hostel_settings (key, value, description) VALUES
    ('notice_period_days', '15', 'Number of days notice required before checkout'),
    ('hostel_name', 'My Hostel', 'Name of the hostel'),
    ('currency', 'PKR', 'Currency used for all financial transactions');

-- ============================================================
-- ACTIVITY LOGS
-- Immutable audit trail for all important operations.
-- ============================================================

CREATE TABLE public.activity_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id   UUID,
    metadata    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Profiles: Owner/Manager can view all profiles
CREATE POLICY "Managers can view all profiles"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('OWNER', 'MANAGER')
        )
    );

-- Hostel settings: All authenticated users can read
CREATE POLICY "Authenticated users can read settings"
    ON public.hostel_settings FOR SELECT
    TO authenticated
    USING (TRUE);

-- Hostel settings: Only owners can update
CREATE POLICY "Owners can update settings"
    ON public.hostel_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'OWNER'
        )
    );

-- Activity logs: All authenticated users can insert
CREATE POLICY "Authenticated users can insert logs"
    ON public.activity_logs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Activity logs: Owner/Manager can view all logs
CREATE POLICY "Managers can view activity logs"
    ON public.activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('OWNER', 'MANAGER')
        )
    );

-- ============================================================
-- FUNCTIONS: Updated At Trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ============================================================
-- Migration: 0002_hostels_and_profiles.sql
-- Description: Multi-hostel entity and profile linkage
-- ============================================================

-- Create hostels table
CREATE TABLE public.hostels (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    address     TEXT,
    phone       TEXT,
    email       TEXT,
    status      TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default initial hostel
INSERT INTO public.hostels (id, name, address, phone, email, status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Main Hostel',
    'Main City Address',
    '+923000000000',
    'info@mainhostel.com',
    'ACTIVE'
);

-- Add hostel_id to profiles
ALTER TABLE public.profiles
    ADD COLUMN hostel_id UUID REFERENCES public.hostels(id) ON DELETE SET NULL;

-- Update profiles for default hostel
UPDATE public.profiles
    SET hostel_id = '00000000-0000-0000-0000-000000000001'
    WHERE hostel_id IS NULL;

-- Add hostel_id to hostel_settings
ALTER TABLE public.hostel_settings
    ADD COLUMN hostel_id UUID REFERENCES public.hostels(id) ON DELETE CASCADE;

UPDATE public.hostel_settings
    SET hostel_id = '00000000-0000-0000-0000-000000000001'
    WHERE hostel_id IS NULL;

-- Update trigger for updated_at on hostels
CREATE TRIGGER set_hostels_updated_at
    BEFORE UPDATE ON public.hostels
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ============================================================
-- Migration: 0003_rooms_beds_assignments_residents.sql
-- Description: Rooms, Beds, Residents, Assignments, and Suspensions
-- ============================================================

-- Add SUSPENDED value to resident_status enum if not existing
ALTER TYPE public.resident_status ADD VALUE IF NOT EXISTS 'SUSPENDED';

-- ============================================================
-- ROOMS
-- ============================================================
CREATE TABLE public.rooms (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostel_id          UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
    room_number        TEXT NOT NULL,
    floor              INTEGER,
    room_type          TEXT NOT NULL CHECK (room_type IN ('SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY')),
    capacity           INTEGER NOT NULL CHECK (capacity > 0),
    operational_status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (operational_status IN ('AVAILABLE', 'MAINTENANCE')),
    monthly_rent       NUMERIC(12,2) NOT NULL CHECK (monthly_rent >= 0),
    description        TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_hostel_room_number UNIQUE (hostel_id, room_number)
);

-- ============================================================
-- BEDS
-- ============================================================
CREATE TABLE public.beds (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id            UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    bed_number         TEXT NOT NULL,
    operational_status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (operational_status IN ('AVAILABLE', 'MAINTENANCE')),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_room_bed_number UNIQUE (room_id, bed_number)
);

-- ============================================================
-- RESIDENTS
-- ============================================================
CREATE TABLE public.residents (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostel_id               UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
    full_name               TEXT NOT NULL,
    phone                   TEXT NOT NULL,
    guardian_name           TEXT,
    emergency_contact_name  TEXT,
    emergency_contact_phone TEXT,
    cnic                    TEXT, -- SENSITIVE PII
    address                 TEXT,
    profile_picture_url     TEXT,
    status                  public.resident_status NOT NULL DEFAULT 'RESERVED',
    created_by              UUID REFERENCES public.profiles(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RESIDENT ASSIGNMENTS
-- Tracks historical & active bed assignments
-- ============================================================
CREATE TABLE public.resident_assignments (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id    UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    bed_id         UUID NOT NULL REFERENCES public.beds(id) ON DELETE CASCADE,
    check_in_date  DATE NOT NULL,
    check_out_date DATE,
    status         TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
    created_by     UUID REFERENCES public.profiles(id),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent two active assignments on the same bed
CREATE UNIQUE INDEX idx_unique_active_bed_assignment
    ON public.resident_assignments(bed_id)
    WHERE status = 'ACTIVE';

-- Prevent multiple active assignments for the same resident
CREATE UNIQUE INDEX idx_unique_active_resident_assignment
    ON public.resident_assignments(resident_id)
    WHERE status = 'ACTIVE';

-- ============================================================
-- RESIDENT SUSPENSIONS
-- Historical audit table for resident suspensions
-- ============================================================
CREATE TABLE public.resident_suspensions (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id  UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    hostel_id    UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
    reason       TEXT NOT NULL,
    suspended_by UUID NOT NULL REFERENCES public.profiles(id),
    start_date   DATE NOT NULL,
    end_date     DATE,
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers for updated_at
CREATE TRIGGER set_rooms_updated_at
    BEFORE UPDATE ON public.rooms
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_beds_updated_at
    BEFORE UPDATE ON public.beds
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_residents_updated_at
    BEFORE UPDATE ON public.residents
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_resident_assignments_updated_at
    BEFORE UPDATE ON public.resident_assignments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_resident_suspensions_updated_at
    BEFORE UPDATE ON public.resident_suspensions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ============================================================
-- Migration: 0004_financial_transactions.sql
-- Description: Financial domain tables (Authoritative transaction logs)
-- ============================================================

-- ============================================================
-- RENT CHARGES
-- ============================================================
CREATE TABLE public.rent_charges (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostel_id      UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
    resident_id    UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    billing_period TEXT NOT NULL, -- e.g., '2026-08'
    amount         NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    due_date       DATE NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_resident_billing_period UNIQUE (resident_id, billing_period)
);

-- ============================================================
-- RENT PAYMENTS
-- ============================================================
CREATE TABLE public.rent_payments (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rent_charge_id   UUID NOT NULL REFERENCES public.rent_charges(id) ON DELETE CASCADE,
    resident_id      UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    amount           NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_date     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payment_method   TEXT NOT NULL CHECK (payment_method IN ('CASH', 'BANK_TRANSFER', 'EASYPAISA', 'JAZZCASH', 'OTHER')),
    reference_number TEXT,
    notes            TEXT,
    recorded_by      UUID NOT NULL REFERENCES public.profiles(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SECURITY DEPOSITS
-- ============================================================
CREATE TABLE public.security_deposits (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostel_id       UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
    resident_id     UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE UNIQUE,
    required_amount NUMERIC(12,2) NOT NULL CHECK (required_amount >= 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SECURITY DEPOSIT PAYMENTS (INSTALLMENTS)
-- ============================================================
CREATE TABLE public.security_deposit_payments (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deposit_id       UUID NOT NULL REFERENCES public.security_deposits(id) ON DELETE CASCADE,
    amount           NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_date     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payment_method   TEXT NOT NULL CHECK (payment_method IN ('CASH', 'BANK_TRANSFER', 'EASYPAISA', 'JAZZCASH', 'OTHER')),
    reference_number TEXT,
    recorded_by      UUID NOT NULL REFERENCES public.profiles(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SECURITY DEPOSIT DEDUCTIONS
-- ============================================================
CREATE TABLE public.security_deposit_deductions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deposit_id  UUID NOT NULL REFERENCES public.security_deposits(id) ON DELETE CASCADE,
    reason      TEXT NOT NULL,
    amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    approved_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FINES (No amount_paid â€” derived from fine_payments!)
-- ============================================================
CREATE TABLE public.fines (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostel_id     UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
    resident_id   UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    reason        TEXT NOT NULL,
    amount        NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    is_waived     BOOLEAN NOT NULL DEFAULT FALSE,
    waived_by     UUID REFERENCES public.profiles(id),
    waived_at     TIMESTAMPTZ,
    waiver_reason TEXT,
    issued_by     UUID NOT NULL REFERENCES public.profiles(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FINE PAYMENTS
-- ============================================================
CREATE TABLE public.fine_payments (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fine_id          UUID NOT NULL REFERENCES public.fines(id) ON DELETE CASCADE,
    amount           NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_date     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payment_method   TEXT NOT NULL CHECK (payment_method IN ('CASH', 'BANK_TRANSFER', 'EASYPAISA', 'JAZZCASH', 'OTHER')),
    reference_number TEXT,
    recorded_by      UUID NOT NULL REFERENCES public.profiles(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers for updated_at
CREATE TRIGGER set_rent_charges_updated_at
    BEFORE UPDATE ON public.rent_charges
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_security_deposits_updated_at
    BEFORE UPDATE ON public.security_deposits
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_fines_updated_at
    BEFORE UPDATE ON public.fines
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ============================================================
-- Migration: 0005_notices_checkout_complaints_ops.sql
-- Description: Notices, Checkout Settlements (Immutable Snapshots), Complaints, Expenses, Visitors
-- ============================================================

-- ============================================================
-- NOTICES
-- ============================================================
CREATE TABLE public.notices (
    id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostel_id              UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
    resident_id            UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    notice_date            DATE NOT NULL,
    required_days          INTEGER NOT NULL DEFAULT 15 CHECK (required_days >= 0),
    expected_checkout_date DATE NOT NULL,
    reason                 TEXT,
    status                 TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'APPROVED', 'CANCELLED', 'COMPLETED')),
    created_by             UUID NOT NULL REFERENCES public.profiles(id),
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CHECKOUT SETTLEMENTS (HISTORICAL SNAPSHOTS ON FINALIZATION)
-- ============================================================
CREATE TABLE public.checkout_settlements (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostel_id                   UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
    resident_id                 UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    notice_id                   UUID REFERENCES public.notices(id),
    checkout_date               DATE NOT NULL,
    snapshot_total_rent_due     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (snapshot_total_rent_due >= 0),
    snapshot_total_fines_due    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (snapshot_total_fines_due >= 0),
    snapshot_deposit_paid       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (snapshot_deposit_paid >= 0),
    snapshot_deposit_deductions NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (snapshot_deposit_deductions >= 0),
    snapshot_refundable_amount  NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (snapshot_refundable_amount >= 0),
    snapshot_net_amount_due     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (snapshot_net_amount_due >= 0),
    status                      TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REFUNDED', 'COMPLETED')),
    notes                       TEXT,
    approved_by                 UUID REFERENCES public.profiles(id),
    approved_at                 TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COMPLAINTS
-- ============================================================
CREATE TABLE public.complaints (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostel_id   UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES public.residents(id) ON DELETE SET NULL,
    room_id     UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    category    TEXT NOT NULL,
    description TEXT NOT NULL,
    priority    TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status      TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    assigned_to UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE public.expenses (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostel_id   UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
    category    TEXT NOT NULL CHECK (category IN ('UTILITIES', 'MAINTENANCE', 'SALARIES', 'CLEANING', 'SECURITY', 'SUPPLIES', 'OTHER')),
    amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    expense_date DATE NOT NULL,
    receipt_url TEXT,
    created_by  UUID NOT NULL REFERENCES public.profiles(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VISITORS
-- ============================================================
CREATE TABLE public.visitors (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostel_id     UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
    resident_id   UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    visitor_name  TEXT NOT NULL,
    visitor_phone TEXT,
    cnic          TEXT,
    relationship  TEXT,
    check_in      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    check_out     TIMESTAMPTZ,
    notes         TEXT,
    recorded_by   UUID NOT NULL REFERENCES public.profiles(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers for updated_at
CREATE TRIGGER set_notices_updated_at
    BEFORE UPDATE ON public.notices
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_checkout_settlements_updated_at
    BEFORE UPDATE ON public.checkout_settlements
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_complaints_updated_at
    BEFORE UPDATE ON public.complaints
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ============================================================
-- Migration: 0006_rls_security_and_indexes.sql
-- Description: RLS policies with hostel isolation, PII security, and performance indexes
-- ============================================================

-- ============================================================
-- INDEXES FOR QUERY PATTERNS
-- ============================================================

-- Hostels & Profiles
CREATE INDEX idx_profiles_hostel_id ON public.profiles(hostel_id);

-- Rooms & Beds
CREATE INDEX idx_rooms_hostel_id ON public.rooms(hostel_id);
CREATE INDEX idx_rooms_status ON public.rooms(operational_status);
CREATE INDEX idx_beds_room_id ON public.beds(room_id);
CREATE INDEX idx_beds_status ON public.beds(operational_status);

-- Residents & Assignments
CREATE INDEX idx_residents_hostel_id ON public.residents(hostel_id);
CREATE INDEX idx_residents_status ON public.residents(status);
CREATE INDEX idx_resident_assignments_resident_id ON public.resident_assignments(resident_id);
CREATE INDEX idx_resident_assignments_bed_id ON public.resident_assignments(bed_id);
CREATE INDEX idx_resident_assignments_status ON public.resident_assignments(status);
CREATE INDEX idx_resident_suspensions_resident_id ON public.resident_suspensions(resident_id);

-- Financials
CREATE INDEX idx_rent_charges_hostel_resident ON public.rent_charges(hostel_id, resident_id);
CREATE INDEX idx_rent_charges_period ON public.rent_charges(billing_period);
CREATE INDEX idx_rent_payments_charge_id ON public.rent_payments(rent_charge_id);
CREATE INDEX idx_rent_payments_date ON public.rent_payments(payment_date);

CREATE INDEX idx_security_deposits_hostel_resident ON public.security_deposits(hostel_id, resident_id);
CREATE INDEX idx_security_deposit_payments_deposit_id ON public.security_deposit_payments(deposit_id);
CREATE INDEX idx_security_deposit_deductions_deposit_id ON public.security_deposit_deductions(deposit_id);

CREATE INDEX idx_fines_hostel_resident ON public.fines(hostel_id, resident_id);
CREATE INDEX idx_fines_waived ON public.fines(is_waived);
CREATE INDEX idx_fine_payments_fine_id ON public.fine_payments(fine_id);

-- Notices & Operations
CREATE INDEX idx_notices_hostel_resident ON public.notices(hostel_id, resident_id);
CREATE INDEX idx_notices_status ON public.notices(status);
CREATE INDEX idx_notices_date ON public.notices(notice_date);

CREATE INDEX idx_checkout_settlements_hostel_resident ON public.checkout_settlements(hostel_id, resident_id);
CREATE INDEX idx_checkout_settlements_status ON public.checkout_settlements(status);

CREATE INDEX idx_complaints_hostel_id ON public.complaints(hostel_id);
CREATE INDEX idx_complaints_status ON public.complaints(status);

CREATE INDEX idx_expenses_hostel_id ON public.expenses(hostel_id);
CREATE INDEX idx_expenses_date ON public.expenses(expense_date);

CREATE INDEX idx_visitors_hostel_resident ON public.visitors(hostel_id, resident_id);
CREATE INDEX idx_visitors_checkin ON public.visitors(check_in);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) ENABLEMENT
-- ============================================================

ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_deposit_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_deposit_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fine_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS HELPER FUNCTION FOR HOSTEL ACCESS
-- Checks if current auth user belongs to the target hostel OR is an OWNER
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_hostel_access(target_hostel_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER STABLE SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = TRUE
        AND (p.role = 'OWNER' OR p.hostel_id = target_hostel_id)
    );
END;
$$;

-- ============================================================
-- RLS POLICIES BY HOSTEL BOUNDARY
-- ============================================================

-- Hostels
CREATE POLICY "Users can view accessible hostels"
    ON public.hostels FOR SELECT
    USING (public.has_hostel_access(id));

CREATE POLICY "Owners can manage hostels"
    ON public.hostels FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'OWNER'
        )
    );

-- Generic policy macros for tables with hostel_id:
-- Rooms
CREATE POLICY "Staff can view rooms" ON public.rooms FOR SELECT USING (public.has_hostel_access(hostel_id));
CREATE POLICY "Managers/Owners can modify rooms" ON public.rooms FOR ALL USING (public.has_hostel_access(hostel_id));

-- Beds
CREATE POLICY "Staff can view beds" ON public.beds FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_id AND public.has_hostel_access(r.hostel_id)));
CREATE POLICY "Managers/Owners can modify beds" ON public.beds FOR ALL
    USING (EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_id AND public.has_hostel_access(r.hostel_id)));

-- Residents
CREATE POLICY "Staff can view residents" ON public.residents FOR SELECT USING (public.has_hostel_access(hostel_id));
CREATE POLICY "Staff can modify residents" ON public.residents FOR ALL USING (public.has_hostel_access(hostel_id));

-- Resident Assignments
CREATE POLICY "Staff can view assignments" ON public.resident_assignments FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.residents r WHERE r.id = resident_id AND public.has_hostel_access(r.hostel_id)));
CREATE POLICY "Staff can modify assignments" ON public.resident_assignments FOR ALL
    USING (EXISTS (SELECT 1 FROM public.residents r WHERE r.id = resident_id AND public.has_hostel_access(r.hostel_id)));

-- Resident Suspensions
CREATE POLICY "Staff can view suspensions" ON public.resident_suspensions FOR SELECT USING (public.has_hostel_access(hostel_id));
CREATE POLICY "Managers/Owners can modify suspensions" ON public.resident_suspensions FOR ALL USING (public.has_hostel_access(hostel_id));

-- Financials (Rent, Deposits, Fines)
CREATE POLICY "Staff can view rent charges" ON public.rent_charges FOR SELECT USING (public.has_hostel_access(hostel_id));
CREATE POLICY "Staff can modify rent charges" ON public.rent_charges FOR ALL USING (public.has_hostel_access(hostel_id));

CREATE POLICY "Staff can view rent payments" ON public.rent_payments FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.residents r WHERE r.id = resident_id AND public.has_hostel_access(r.hostel_id)));
CREATE POLICY "Staff can insert rent payments" ON public.rent_payments FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.residents r WHERE r.id = resident_id AND public.has_hostel_access(r.hostel_id)));

CREATE POLICY "Staff can view security deposits" ON public.security_deposits FOR SELECT USING (public.has_hostel_access(hostel_id));
CREATE POLICY "Staff can modify security deposits" ON public.security_deposits FOR ALL USING (public.has_hostel_access(hostel_id));

CREATE POLICY "Staff can view deposit payments" ON public.security_deposit_payments FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.security_deposits d WHERE d.id = deposit_id AND public.has_hostel_access(d.hostel_id)));
CREATE POLICY "Staff can insert deposit payments" ON public.security_deposit_payments FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.security_deposits d WHERE d.id = deposit_id AND public.has_hostel_access(d.hostel_id)));

CREATE POLICY "Staff can view deposit deductions" ON public.security_deposit_deductions FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.security_deposits d WHERE d.id = deposit_id AND public.has_hostel_access(d.hostel_id)));
CREATE POLICY "Managers/Owners can insert deposit deductions" ON public.security_deposit_deductions FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.security_deposits d WHERE d.id = deposit_id AND public.has_hostel_access(d.hostel_id)));

CREATE POLICY "Staff can view fines" ON public.fines FOR SELECT USING (public.has_hostel_access(hostel_id));
CREATE POLICY "Staff can modify fines" ON public.fines FOR ALL USING (public.has_hostel_access(hostel_id));

CREATE POLICY "Staff can view fine payments" ON public.fine_payments FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.fines f WHERE f.id = fine_id AND public.has_hostel_access(f.hostel_id)));
CREATE POLICY "Staff can insert fine payments" ON public.fine_payments FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.fines f WHERE f.id = fine_id AND public.has_hostel_access(f.hostel_id)));

-- Notices & Checkout
CREATE POLICY "Staff can view notices" ON public.notices FOR SELECT USING (public.has_hostel_access(hostel_id));
CREATE POLICY "Staff can modify notices" ON public.notices FOR ALL USING (public.has_hostel_access(hostel_id));

CREATE POLICY "Staff can view checkout settlements" ON public.checkout_settlements FOR SELECT USING (public.has_hostel_access(hostel_id));
CREATE POLICY "Managers/Owners can modify checkout settlements" ON public.checkout_settlements FOR ALL USING (public.has_hostel_access(hostel_id));

-- Complaints, Expenses, Visitors
CREATE POLICY "Staff can view complaints" ON public.complaints FOR SELECT USING (public.has_hostel_access(hostel_id));
CREATE POLICY "Staff can modify complaints" ON public.complaints FOR ALL USING (public.has_hostel_access(hostel_id));

CREATE POLICY "Staff can view expenses" ON public.expenses FOR SELECT USING (public.has_hostel_access(hostel_id));
CREATE POLICY "Staff can modify expenses" ON public.expenses FOR ALL USING (public.has_hostel_access(hostel_id));

CREATE POLICY "Staff can view visitors" ON public.visitors FOR SELECT USING (public.has_hostel_access(hostel_id));
CREATE POLICY "Staff can modify visitors" ON public.visitors FOR ALL USING (public.has_hostel_access(hostel_id));

-- ============================================================
-- PII SECURITY: MASKED CNIC VIEW FOR GENERAL WORKERS
-- Non-owners/managers see masked CNIC (e.g. '42101-*******-1')
-- ============================================================

CREATE OR REPLACE VIEW public.residents_safe AS
SELECT
    r.id,
    r.hostel_id,
    r.full_name,
    r.phone,
    r.guardian_name,
    r.emergency_contact_name,
    r.emergency_contact_phone,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('OWNER', 'MANAGER', 'ACCOUNTANT')
        ) THEN r.cnic
        WHEN r.cnic IS NOT NULL AND length(r.cnic) >= 15 THEN
            substring(r.cnic from 1 for 6) || '*******' || substring(r.cnic from 14 for 2)
        ELSE '***-RESTRICTED-***'
    END AS cnic,
    r.address,
    r.profile_picture_url,
    r.status,
    r.created_by,
    r.created_at,
    r.updated_at
FROM public.residents r;
