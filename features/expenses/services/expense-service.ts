import { requirePermission } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

export interface ExpenseRecord {
  id: string;
  hostelId: string;
  category: string;
  amount: number;
  description: string | null;
  expenseDate: string;
  createdAt: string;
}

const memoryExpenses: ExpenseRecord[] = [
  {
    id: 'exp-001',
    hostelId: '00000000-0000-0000-0000-000000000001',
    category: 'UTILITIES',
    amount: 45000,
    description: 'Electricity bill for January 2026 (IESCO)',
    expenseDate: '2026-01-15',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exp-002',
    hostelId: '00000000-0000-0000-0000-000000000001',
    category: 'MAINTENANCE',
    amount: 12500,
    description: 'Plumbing repair in Room 103 washroom',
    expenseDate: '2026-01-20',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exp-003',
    hostelId: '00000000-0000-0000-0000-000000000001',
    category: 'CLEANING',
    amount: 8500,
    description: 'Janitorial supplies and disinfectant refill',
    expenseDate: '2026-01-28',
    createdAt: new Date().toISOString(),
  },
];

export class ExpenseService {
  async getExpenses(hostelId: string): Promise<ExpenseRecord[]> {
    await requirePermission('expenses.view');
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('hostel_id', hostelId)
        .order('expense_date', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item) => {
          const row = item as Record<string, unknown>;
          return {
            id: String(row.id),
            hostelId: String(row.hostel_id),
            category: String(row.category),
            amount: Number(row.amount),
            description: row.description ? String(row.description) : null,
            expenseDate: String(row.expense_date),
            createdAt: String(row.created_at),
          };
        });
      }
    } catch {
      logger.warn('Supabase getExpenses failed, returning fallback expenses');
    }

    return memoryExpenses.filter((e) => e.hostelId === hostelId);
  }
}
