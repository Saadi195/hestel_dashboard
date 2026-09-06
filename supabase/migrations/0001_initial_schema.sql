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
        -- Directly check the auth.jwt() claims or use a non-recursive approach
        -- To avoid recursion, we check if the current user's role is OWNER or MANAGER
        -- without selecting from public.profiles in a correlated subquery that triggers the policy again.
        (auth.uid() = id) OR
        (current_setting('request.jwt.claims', true)::json->>'role' IN ('OWNER', 'MANAGER'))
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
