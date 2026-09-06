import { requirePermission } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import { getTable } from '@/lib/supabase/db-helper';
import { createClient } from '@/lib/supabase/server';

export interface EmployeeProfile {
  id: string;
  hostelId: string | null;
  role: string;
  fullName: string | null;
  email: string | null;
  createdAt: string;
}

const memoryEmployees: EmployeeProfile[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    hostelId: '00000000-0000-0000-0000-000000000001',
    role: 'OWNER',
    fullName: 'Tariq Mehmood',
    email: 'owner@hostel.com',
    createdAt: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    hostelId: '00000000-0000-0000-0000-000000000001',
    role: 'MANAGER',
    fullName: 'Sarah Khan',
    email: 'manager@hostel.com',
    createdAt: new Date().toISOString(),
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    hostelId: '00000000-0000-0000-0000-000000000001',
    role: 'RECEPTIONIST',
    fullName: 'Bilal Ahmed',
    email: 'receptionist@hostel.com',
    createdAt: new Date().toISOString(),
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    hostelId: '00000000-0000-0000-0000-000000000001',
    role: 'ACCOUNTANT',
    fullName: 'Zainab Fatima',
    email: 'accountant@hostel.com',
    createdAt: new Date().toISOString(),
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    hostelId: '00000000-0000-0000-0000-000000000001',
    role: 'MAINTENANCE',
    fullName: 'Rashid Ali',
    email: 'maintenance@hostel.com',
    createdAt: new Date().toISOString(),
  },
];

export class EmployeeService {
  async getEmployees(_hostelId: string): Promise<EmployeeProfile[]> {
    await requirePermission('employees.view');
    try {
      const supabase = await createClient();

      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item) => {
          const row = item as Record<string, unknown>;
          return {
            id: String(row.id),
            hostelId: row.hostel_id ? String(row.hostel_id) : null,
            role: String(row.role),
            fullName: row.full_name ? String(row.full_name) : null,
            email: row.email ? String(row.email) : null,
            createdAt: String(row.created_at),
          };
        });
      }
    } catch {
      logger.warn('Supabase getEmployees failed, returning fallback employees');
    }

    return [...memoryEmployees];
  }

  async updateRole(employeeId: string, role: string) {
    const user = await requirePermission('employees.manage');
    try {
      const supabase = await createClient();

      await getTable(supabase, 'profiles').update({ role }).eq('id', employeeId);

      await getTable(supabase, 'activity_logs').insert({
        user_id: user.id,
        action: 'EMPLOYEE_ROLE_CHANGED',
        entity_type: 'profile',
        entity_id: employeeId,
        metadata: { newRole: role },
      });
    } catch {
      logger.warn('Supabase updateRole failed, updating memory store');
    }

    const emp = memoryEmployees.find((e) => e.id === employeeId);
    if (emp) {
      emp.role = role;
    }
  }
}
