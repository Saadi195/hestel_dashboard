import type { Metadata } from 'next';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { DataTable, type Column } from '@/components/shared/data-table';
import { DateDisplay } from '@/components/shared/date-display';
import { VisitorService, type VisitorRecord } from '@/features/visitors/services/visitor-service';

export const metadata: Metadata = {
  title: 'Visitors Log',
};

export default async function VisitorsPage() {
  const visitorService = new VisitorService();
  const defaultHostelId = '00000000-0000-0000-0000-000000000001';

  const visitors = await visitorService.getVisitors(defaultHostelId).catch(() => []);

  const columns: Column<VisitorRecord>[] = [
    {
      header: 'Visitor Name',
      cell: (v) => (
        <div>
          <span className="font-semibold">{v.visitorName}</span>
          <p className="text-xs text-muted-foreground">{v.visitorPhone ?? '—'}</p>
        </div>
      ),
    },
    {
      header: 'Visiting Resident',
      cell: (v) => <span className="font-medium text-primary">{v.residentName}</span>,
    },
    {
      header: 'Purpose',
      cell: (v) => <span className="text-xs">{v.purpose ?? '—'}</span>,
    },
    {
      header: 'Check In',
      cell: (v) => <DateDisplay date={v.checkIn} className="text-xs font-medium" />,
    },
    {
      header: 'Check Out',
      cell: (v) => <DateDisplay date={v.checkOut} fallback="Still Inside" className="text-xs" />,
    },
  ];

  return (
    <DashboardShell
      heading="Visitors Log"
      description="Track resident visitors, check-in timestamps, contact details, and check-out logs"
    >
      <DataTable
        columns={columns}
        data={visitors}
        keyExtractor={(v) => v.id}
        emptyTitle="No visitor logs recorded"
        emptyDescription="There are currently no visitor entries on record."
      />
    </DashboardShell>
  );
}
