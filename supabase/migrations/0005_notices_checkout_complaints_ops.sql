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
