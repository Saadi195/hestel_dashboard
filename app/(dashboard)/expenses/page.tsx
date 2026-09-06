import type { Metadata } from 'next';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { DataTable, type Column } from '@/components/shared/data-table';
import { DateDisplay } from '@/components/shared/date-display';
import { ExpenseService, type ExpenseRecord } from '@/features/expenses/services/expense-service';

export const metadata: Metadata = {
  title: 'Expenses Management',
};

export default async function ExpensesPage() {
  const expenseService = new ExpenseService();
  const defaultHostelId = '00000000-0000-0000-0000-000000000001';

  const expenses = await expenseService.getExpenses(defaultHostelId).catch(() => []);

  const columns: Column<ExpenseRecord>[] = [
    {
      header: 'Expense Category',
      cell: (e) => <span className="font-semibold">{e.category}</span>,
    },
    {
      header: 'Description',
      cell: (e) => <span className="text-xs text-muted-foreground">{e.description ?? '—'}</span>,
    },
    {
      header: 'Amount',
      cell: (e) => <CurrencyDisplay amount={e.amount} className="font-bold text-red-600" />,
    },
    {
      header: 'Expense Date',
      cell: (e) => <DateDisplay date={e.expenseDate} className="text-xs" />,
    },
  ];

  return (
    <DashboardShell
      heading="Expenses Management"
      description="Track hostel operational expenditures (UTILITIES, MAINTENANCE, SALARIES, CLEANING, SECURITY, SUPPLIES)"
    >
      <DataTable
        columns={columns}
        data={expenses}
        keyExtractor={(e) => e.id}
        emptyTitle="No expenses recorded"
        emptyDescription="There are currently no hostel operational expense logs on record."
      />
    </DashboardShell>
  );
}
