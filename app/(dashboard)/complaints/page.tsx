import type { Metadata } from 'next';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { DataTable, type Column } from '@/components/shared/data-table';
import { DateDisplay } from '@/components/shared/date-display';
import { StatusBadge } from '@/components/shared/status-badge';
import { ComplaintService, type ComplaintRecord } from '@/features/complaints/services/complaint-service';

export const metadata: Metadata = {
  title: 'Complaints & Maintenance Tickets',
};

export default async function ComplaintsPage() {
  const complaintService = new ComplaintService();
  const defaultHostelId = '00000000-0000-0000-0000-000000000001';

  const complaints = await complaintService.getComplaints(defaultHostelId).catch(() => []);

  const columns: Column<ComplaintRecord>[] = [
    {
      header: 'Complaint Title',
      cell: (c) => (
        <div>
          <span className="font-semibold">{c.title}</span>
          <p className="text-xs text-muted-foreground">{c.description}</p>
        </div>
      ),
    },
    {
      header: 'Category',
      cell: (c) => <span className="text-xs font-medium">{c.category}</span>,
    },
    {
      header: 'Priority',
      cell: (c) => <StatusBadge status={c.priority} />,
    },
    {
      header: 'Status',
      cell: (c) => <StatusBadge status={c.status} />,
    },
    {
      header: 'Reported Date',
      cell: (c) => <DateDisplay date={c.createdAt} className="text-xs" />,
    },
  ];

  return (
    <DashboardShell
      heading="Complaints & Maintenance Tickets"
      description="Track operational issues, maintenance tickets, priorities, and status resolutions"
    >
      <DataTable
        columns={columns}
        data={complaints}
        keyExtractor={(c) => c.id}
        emptyTitle="No complaints logged"
        emptyDescription="There are currently no open or resolved maintenance complaints on record."
      />
    </DashboardShell>
  );
}
