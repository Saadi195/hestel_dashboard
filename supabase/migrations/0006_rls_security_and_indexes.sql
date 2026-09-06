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
