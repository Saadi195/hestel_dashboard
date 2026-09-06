import type { Metadata } from 'next';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { DataTable, type Column } from '@/components/shared/data-table';
import { DateDisplay } from '@/components/shared/date-display';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmployeeService, type EmployeeProfile } from '@/features/employees/services/employee-service';

export const metadata: Metadata = {
  title: 'Employees & RBAC Management',
};

export default async function EmployeesPage() {
  const employeeService = new EmployeeService();
  const defaultHostelId = '00000000-0000-0000-0000-000000000001';

  const employees = await employeeService.getEmployees(defaultHostelId).catch(() => []);

  const columns: Column<EmployeeProfile>[] = [
    {
      header: 'Employee Name',
      cell: (e) => (
        <div>
          <span className="font-semibold">{e.fullName ?? 'Staff Member'}</span>
          <p className="text-xs text-muted-foreground">{e.email ?? '—'}</p>
        </div>
      ),
    },
    {
      header: 'Assigned Role',
      cell: (e) => <StatusBadge status={e.role} />,
    },
    {
      header: 'Joined Date',
      cell: (e) => <DateDisplay date={e.createdAt} className="text-xs" />,
    },
  ];

  return (
    <DashboardShell
      heading="Employees & RBAC Management"
      description="Manage staff members, RBAC authorization roles (OWNER, MANAGER, RECEPTIONIST, ACCOUNTANT, MAINTENANCE)"
    >
      <DataTable
        columns={columns}
        data={employees}
        keyExtractor={(e) => e.id}
        emptyTitle="No employees registered"
        emptyDescription="Staff members will appear here once authenticated."
      />
    </DashboardShell>
  );
}
