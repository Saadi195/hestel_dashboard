/**
 * Database types generated from Supabase schema.
 *
 * Reflects full Phase 2 schema (0001 through 0006 migrations).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      hostels: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          phone: string | null;
          email: string | null;
          status: 'ACTIVE' | 'INACTIVE';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          status?: 'ACTIVE' | 'INACTIVE';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          status?: 'ACTIVE' | 'INACTIVE';
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          hostel_id: string | null;
          email: string;
          name: string | null;
          role: 'OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'ACCOUNTANT' | 'MAINTENANCE';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          hostel_id?: string | null;
          email: string;
          name?: string | null;
          role: 'OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'ACCOUNTANT' | 'MAINTENANCE';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          hostel_id?: string | null;
          email?: string;
          name?: string | null;
          role?: 'OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'ACCOUNTANT' | 'MAINTENANCE';
          is_active?: boolean;
          updated_at?: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          hostel_id: string;
          room_number: string;
          floor: number | null;
          room_type: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'DORMITORY';
          capacity: number;
          operational_status: 'AVAILABLE' | 'MAINTENANCE';
          monthly_rent: number;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hostel_id: string;
          room_number: string;
          floor?: number | null;
          room_type: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'DORMITORY';
          capacity: number;
          operational_status?: 'AVAILABLE' | 'MAINTENANCE';
          monthly_rent: number;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          room_number?: string;
          floor?: number | null;
          room_type?: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'DORMITORY';
          capacity?: number;
          operational_status?: 'AVAILABLE' | 'MAINTENANCE';
          monthly_rent?: number;
          description?: string | null;
          updated_at?: string;
        };
      };
      beds: {
        Row: {
          id: string;
          room_id: string;
          bed_number: string;
          operational_status: 'AVAILABLE' | 'MAINTENANCE';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          bed_number: string;
          operational_status?: 'AVAILABLE' | 'MAINTENANCE';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          bed_number?: string;
          operational_status?: 'AVAILABLE' | 'MAINTENANCE';
          updated_at?: string;
        };
      };
      residents: {
        Row: {
          id: string;
          hostel_id: string;
          full_name: string;
          phone: string;
          guardian_name: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          cnic: string | null;
          address: string | null;
          profile_picture_url: string | null;
          status: 'RESERVED' | 'ACTIVE' | 'NOTICE_PERIOD' | 'CHECKOUT_PENDING' | 'CHECKED_OUT' | 'SUSPENDED';
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hostel_id: string;
          full_name: string;
          phone: string;
          guardian_name?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          cnic?: string | null;
          address?: string | null;
          profile_picture_url?: string | null;
          status?: 'RESERVED' | 'ACTIVE' | 'NOTICE_PERIOD' | 'CHECKOUT_PENDING' | 'CHECKED_OUT' | 'SUSPENDED';
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          phone?: string;
          guardian_name?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          cnic?: string | null;
          address?: string | null;
          profile_picture_url?: string | null;
          status?: 'RESERVED' | 'ACTIVE' | 'NOTICE_PERIOD' | 'CHECKOUT_PENDING' | 'CHECKED_OUT' | 'SUSPENDED';
          updated_at?: string;
        };
      };
      resident_assignments: {
        Row: {
          id: string;
          resident_id: string;
          bed_id: string;
          check_in_date: string;
          check_out_date: string | null;
          status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          resident_id: string;
          bed_id: string;
          check_in_date: string;
          check_out_date?: string | null;
          status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          check_out_date?: string | null;
          status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
          updated_at?: string;
        };
      };
      resident_suspensions: {
        Row: {
          id: string;
          resident_id: string;
          hostel_id: string;
          reason: string;
          suspended_by: string;
          start_date: string;
          end_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          resident_id: string;
          hostel_id: string;
          reason: string;
          suspended_by: string;
          start_date: string;
          end_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          reason?: string;
          end_date?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      rent_charges: {
        Row: {
          id: string;
          hostel_id: string;
          resident_id: string;
          billing_period: string;
          amount: number;
          due_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hostel_id: string;
          resident_id: string;
          billing_period: string;
          amount: number;
          due_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          due_date?: string;
          updated_at?: string;
        };
      };
      rent_payments: {
        Row: {
          id: string;
          rent_charge_id: string;
          resident_id: string;
          amount: number;
          payment_date: string;
          payment_method: 'CASH' | 'BANK_TRANSFER' | 'EASYPAISA' | 'JAZZCASH' | 'OTHER';
          reference_number: string | null;
          notes: string | null;
          recorded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          rent_charge_id: string;
          resident_id: string;
          amount: number;
          payment_date?: string;
          payment_method: 'CASH' | 'BANK_TRANSFER' | 'EASYPAISA' | 'JAZZCASH' | 'OTHER';
          reference_number?: string | null;
          notes?: string | null;
          recorded_by: string;
          created_at?: string;
        };
        Update: never; // Immutable
      };
      security_deposits: {
        Row: {
          id: string;
          hostel_id: string;
          resident_id: string;
          required_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hostel_id: string;
          resident_id: string;
          required_amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          required_amount?: number;
          updated_at?: string;
        };
      };
      security_deposit_payments: {
        Row: {
          id: string;
          deposit_id: string;
          amount: number;
          payment_date: string;
          payment_method: 'CASH' | 'BANK_TRANSFER' | 'EASYPAISA' | 'JAZZCASH' | 'OTHER';
          reference_number: string | null;
          recorded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          deposit_id: string;
          amount: number;
          payment_date?: string;
          payment_method: 'CASH' | 'BANK_TRANSFER' | 'EASYPAISA' | 'JAZZCASH' | 'OTHER';
          reference_number?: string | null;
          recorded_by: string;
          created_at?: string;
        };
        Update: never;
      };
      security_deposit_deductions: {
        Row: {
          id: string;
          deposit_id: string;
          reason: string;
          amount: number;
          approved_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          deposit_id: string;
          reason: string;
          amount: number;
          approved_by: string;
          created_at?: string;
        };
        Update: never;
      };
      fines: {
        Row: {
          id: string;
          hostel_id: string;
          resident_id: string;
          title: string;
          reason: string;
          amount: number;
          is_waived: boolean;
          waived_by: string | null;
          waived_at: string | null;
          waiver_reason: string | null;
          issued_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hostel_id: string;
          resident_id: string;
          title: string;
          reason: string;
          amount: number;
          is_waived?: boolean;
          waived_by?: string | null;
          waived_at?: string | null;
          waiver_reason?: string | null;
          issued_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          reason?: string;
          amount?: number;
          is_waived?: boolean;
          waived_by?: string | null;
          waived_at?: string | null;
          waiver_reason?: string | null;
          updated_at?: string;
        };
      };
      fine_payments: {
        Row: {
          id: string;
          fine_id: string;
          amount: number;
          payment_date: string;
          payment_method: 'CASH' | 'BANK_TRANSFER' | 'EASYPAISA' | 'JAZZCASH' | 'OTHER';
          reference_number: string | null;
          recorded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          fine_id: string;
          amount: number;
          payment_date?: string;
          payment_method: 'CASH' | 'BANK_TRANSFER' | 'EASYPAISA' | 'JAZZCASH' | 'OTHER';
          reference_number?: string | null;
          recorded_by: string;
          created_at?: string;
        };
        Update: never;
      };
      notices: {
        Row: {
          id: string;
          hostel_id: string;
          resident_id: string;
          notice_date: string;
          required_days: number;
          expected_checkout_date: string;
          reason: string | null;
          status: 'SUBMITTED' | 'APPROVED' | 'CANCELLED' | 'COMPLETED';
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hostel_id: string;
          resident_id: string;
          notice_date: string;
          required_days?: number;
          expected_checkout_date: string;
          reason?: string | null;
          status?: 'SUBMITTED' | 'APPROVED' | 'CANCELLED' | 'COMPLETED';
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'SUBMITTED' | 'APPROVED' | 'CANCELLED' | 'COMPLETED';
          updated_at?: string;
        };
      };
      checkout_settlements: {
        Row: {
          id: string;
          hostel_id: string;
          resident_id: string;
          notice_id: string | null;
          checkout_date: string;
          snapshot_total_rent_due: number;
          snapshot_total_fines_due: number;
          snapshot_deposit_paid: number;
          snapshot_deposit_deductions: number;
          snapshot_refundable_amount: number;
          snapshot_net_amount_due: number;
          status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REFUNDED' | 'COMPLETED';
          notes: string | null;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hostel_id: string;
          resident_id: string;
          notice_id?: string | null;
          checkout_date: string;
          snapshot_total_rent_due?: number;
          snapshot_total_fines_due?: number;
          snapshot_deposit_paid?: number;
          snapshot_deposit_deductions?: number;
          snapshot_refundable_amount?: number;
          snapshot_net_amount_due?: number;
          status?: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REFUNDED' | 'COMPLETED';
          notes?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          snapshot_total_rent_due?: number;
          snapshot_total_fines_due?: number;
          snapshot_deposit_paid?: number;
          snapshot_deposit_deductions?: number;
          snapshot_refundable_amount?: number;
          snapshot_net_amount_due?: number;
          status?: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REFUNDED' | 'COMPLETED';
          notes?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          updated_at?: string;
        };
      };
      complaints: {
        Row: {
          id: string;
          hostel_id: string;
          resident_id: string | null;
          room_id: string | null;
          category: string;
          description: string;
          priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
          status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
          assigned_to: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hostel_id: string;
          resident_id?: string | null;
          room_id?: string | null;
          category: string;
          description: string;
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
          status?: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
          assigned_to?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          description?: string;
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
          status?: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
          assigned_to?: string | null;
          resolved_at?: string | null;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          hostel_id: string;
          category: 'UTILITIES' | 'MAINTENANCE' | 'SALARIES' | 'CLEANING' | 'SECURITY' | 'SUPPLIES' | 'OTHER';
          amount: number;
          description: string;
          expense_date: string;
          receipt_url: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hostel_id: string;
          category: 'UTILITIES' | 'MAINTENANCE' | 'SALARIES' | 'CLEANING' | 'SECURITY' | 'SUPPLIES' | 'OTHER';
          amount: number;
          description: string;
          expense_date: string;
          receipt_url?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category?: 'UTILITIES' | 'MAINTENANCE' | 'SALARIES' | 'CLEANING' | 'SECURITY' | 'SUPPLIES' | 'OTHER';
          amount?: number;
          description?: string;
          expense_date?: string;
          receipt_url?: string | null;
          updated_at?: string;
        };
      };
      visitors: {
        Row: {
          id: string;
          hostel_id: string;
          resident_id: string;
          visitor_name: string;
          visitor_phone: string | null;
          cnic: string | null;
          relationship: string | null;
          check_in: string;
          check_out: string | null;
          notes: string | null;
          recorded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          hostel_id: string;
          resident_id: string;
          visitor_name: string;
          visitor_phone?: string | null;
          cnic?: string | null;
          relationship?: string | null;
          check_in?: string;
          check_out?: string | null;
          notes?: string | null;
          recorded_by: string;
          created_at?: string;
        };
        Update: {
          check_out?: string | null;
          notes?: string | null;
        };
      };
      hostel_settings: {
        Row: {
          id: string;
          hostel_id: string | null;
          key: string;
          value: string;
          description: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hostel_id?: string | null;
          key: string;
          value: string;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          value?: string;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: 'OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'ACCOUNTANT' | 'MAINTENANCE';
      resident_status: 'RESERVED' | 'ACTIVE' | 'NOTICE_PERIOD' | 'CHECKOUT_PENDING' | 'CHECKED_OUT' | 'SUSPENDED';
    };
  };
}
