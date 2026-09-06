import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export interface DashboardMetrics {
  totalResidents: number;
  activeResidents: number;
  noticePeriodResidents: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  pendingRent: number;
  outstandingFines: number;
  securityDepositsHeld: number;
  pendingCheckoutRequests: number;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    createdAt: string;
  }>;
}

const DEFAULT_METRICS: DashboardMetrics = {
  totalResidents: 0,
  activeResidents: 0,
  noticePeriodResidents: 0,
  totalRooms: 0,
  totalBeds: 0,
  occupiedBeds: 0,
  availableBeds: 0,
  pendingRent: 0,
  outstandingFines: 0,
  securityDepositsHeld: 0,
  pendingCheckoutRequests: 0,
  recentActivity: [],
};

export class DashboardService {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    await requirePermission('residents.view');
    return this.fetchMetricsFromSupabase();
  }

  private async fetchMetricsFromSupabase(): Promise<DashboardMetrics> {
    try {
      const supabase = await createClient();

      const [
        { count: totalResidents },
        { count: activeResidents },
        { count: noticePeriodResidents },
        { count: totalRooms },
        { count: totalBeds },
        { count: occupiedBeds },
        { data: rentCharges },
        { data: rentPayments },
        { data: fines },
        { data: finePayments },
        { data: depositPayments },
        { data: depositDeductions },
        { count: pendingCheckoutRequests },
        { data: activityRows },
      ] = await Promise.all([
        supabase.from('residents').select('*', { count: 'exact', head: true }),
        supabase.from('residents').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
        supabase.from('residents').select('*', { count: 'exact', head: true }).eq('status', 'NOTICE_PERIOD'),
        supabase.from('rooms').select('*', { count: 'exact', head: true }),
        supabase.from('beds').select('*', { count: 'exact', head: true }),
        supabase.from('resident_assignments').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
        supabase.from('rent_charges').select('amount'),
        supabase.from('rent_payments').select('amount'),
        supabase.from('fines').select('amount').eq('is_waived', false),
        supabase.from('fine_payments').select('amount'),
        supabase.from('security_deposit_payments').select('amount'),
        supabase.from('security_deposit_deductions').select('amount'),
        supabase.from('checkout_settlements').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      const calculatedTotalBeds = totalBeds ?? 0;
      const calculatedOccupiedBeds = occupiedBeds ?? 0;
      const availableBeds = Math.max(0, calculatedTotalBeds - calculatedOccupiedBeds);

      const totalRentCharged = (rentCharges ?? []).reduce((acc: number, r: Record<string, unknown>) => acc + Number(r['amount']), 0);
      const totalRentPaid = (rentPayments ?? []).reduce((acc: number, p: Record<string, unknown>) => acc + Number(p['amount']), 0);
      const pendingRent = Math.max(0, totalRentCharged - totalRentPaid);

      const totalFinesIssued = (fines ?? []).reduce((acc: number, f: Record<string, unknown>) => acc + Number(f['amount']), 0);
      const totalFinesPaid = (finePayments ?? []).reduce((acc: number, fp: Record<string, unknown>) => acc + Number(fp['amount']), 0);
      const outstandingFines = Math.max(0, totalFinesIssued - totalFinesPaid);

      const totalDepositPaid = (depositPayments ?? []).reduce((acc: number, dp: Record<string, unknown>) => acc + Number(dp['amount']), 0);
      const totalDepositDeducted = (depositDeductions ?? []).reduce((acc: number, dd: Record<string, unknown>) => acc + Number(dd['amount']), 0);
      const securityDepositsHeld = Math.max(0, totalDepositPaid - totalDepositDeducted);

      const recentActivity = (activityRows ?? []).map((item) => {
        const log = item as Record<string, unknown>;
        return {
          id: String(log['id']),
          action: String(log['action']),
          entityType: String(log['entity_type']),
          entityId: log['entity_id'] ? String(log['entity_id']) : null,
          createdAt: String(log['created_at']),
        };
      });

      return {
        totalResidents: totalResidents ?? 0,
        activeResidents: activeResidents ?? 0,
        noticePeriodResidents: noticePeriodResidents ?? 0,
        totalRooms: totalRooms ?? 0,
        totalBeds: calculatedTotalBeds,
        occupiedBeds: calculatedOccupiedBeds,
        availableBeds,
        pendingRent,
        outstandingFines,
        securityDepositsHeld,
        pendingCheckoutRequests: pendingCheckoutRequests ?? 0,
        recentActivity,
      };
    } catch {
      return DEFAULT_METRICS;
    }
  }
}
