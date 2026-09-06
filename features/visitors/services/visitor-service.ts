import { requirePermission } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

export interface VisitorRecord {
  id: string;
  hostelId: string;
  residentId: string;
  residentName: string;
  visitorName: string;
  visitorCnic: string | null;
  visitorPhone: string | null;
  purpose: string | null;
  checkIn: string;
  checkOut: string | null;
}

const memoryVisitors: VisitorRecord[] = [
  {
    id: 'vis-001',
    hostelId: '00000000-0000-0000-0000-000000000001',
    residentId: '30000000-0000-0000-0000-000000000001',
    residentName: 'Hamza Malik',
    visitorName: 'Tariq Malik (Father)',
    visitorCnic: '61101-9998877-1',
    visitorPhone: '+92 300 7776655',
    purpose: 'Family Visit',
    checkIn: '2026-02-01T14:30:00Z',
    checkOut: '2026-02-01T17:00:00Z',
  },
  {
    id: 'vis-002',
    hostelId: '00000000-0000-0000-0000-000000000001',
    residentId: '30000000-0000-0000-0000-000000000003',
    residentName: 'Farhan Hassan',
    visitorName: 'Bilal Ahmed',
    visitorCnic: '42101-3334455-7',
    visitorPhone: '+92 321 8889900',
    purpose: 'Study Group Meeting',
    checkIn: '2026-02-05T18:00:00Z',
    checkOut: null,
  },
];

export class VisitorService {
  async getVisitors(hostelId: string): Promise<VisitorRecord[]> {
    await requirePermission('visitors.view');
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('visitors')
        .select('*, residents(full_name)')
        .eq('hostel_id', hostelId)
        .order('check_in', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item) => {
          const row = item as Record<string, unknown>;
          const residents = row.residents as Record<string, unknown> | null;
          return {
            id: String(row.id),
            hostelId: String(row.hostel_id),
            residentId: String(row.resident_id),
            residentName: residents?.full_name ? String(residents.full_name) : 'Unknown Resident',
            visitorName: String(row.visitor_name),
            visitorCnic: row.visitor_cnic ? String(row.visitor_cnic) : null,
            visitorPhone: row.visitor_phone ? String(row.visitor_phone) : null,
            purpose: row.purpose ? String(row.purpose) : null,
            checkIn: String(row.check_in),
            checkOut: row.check_out ? String(row.check_out) : null,
          };
        });
      }
    } catch {
      logger.warn('Supabase getVisitors failed, returning fallback visitors');
    }

    return memoryVisitors.filter((v) => v.hostelId === hostelId);
  }
}
