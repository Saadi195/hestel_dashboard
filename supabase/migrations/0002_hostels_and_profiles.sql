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
