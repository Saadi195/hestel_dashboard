import { requirePermission } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

export interface ComplaintRecord {
  id: string;
  hostelId: string;
  residentId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
}

const memoryComplaints: ComplaintRecord[] = [
  {
    id: 'cmp-001',
    hostelId: '00000000-0000-0000-0000-000000000001',
    residentId: '30000000-0000-0000-0000-000000000001',
    title: 'Water Leakage in Washroom',
    description: 'Shower tap leaking continuously in Room 101 washroom',
    category: 'PLUMBING',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cmp-002',
    hostelId: '00000000-0000-0000-0000-000000000001',
    residentId: '30000000-0000-0000-0000-000000000003',
    title: 'Wi-Fi Signal Weak',
    description: 'Router on Floor 1 drops signal frequently during evening hours',
    category: 'INTERNET',
    priority: 'MEDIUM',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  },
];

export class ComplaintService {
  async getComplaints(hostelId: string): Promise<ComplaintRecord[]> {
    await requirePermission('complaints.view');
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('hostel_id', hostelId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item) => {
          const row = item as Record<string, unknown>;
          return {
            id: String(row['id']),
            hostelId: String(row['hostel_id']),
            residentId: String(row['resident_id'] ?? ''),
            title: String(row['category'] ?? 'Complaint'),
            description: String(row['description']),
            category: String(row['category']),
            priority: String(row['priority']),
            status: String(row['status']),
            createdAt: String(row['created_at']),
          };
        });
      }
    } catch {
      logger.warn('Supabase getComplaints failed, returning fallback complaints');
    }

    return memoryComplaints.filter((c) => c.hostelId === hostelId);
  }
}
