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
-- FINES (No amount_paid — derived from fine_payments!)
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
