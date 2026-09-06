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
