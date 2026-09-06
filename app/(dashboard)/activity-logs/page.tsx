import type { Metadata } from 'next';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { DataTable, type Column } from '@/components/shared/data-table';
import { DateDisplay } from '@/components/shared/date-display';
import { StatusBadge } from '@/components/shared/status-badge';
import { ActivityLogService, type ActivityLogRecord } from '@/features/activity-logs/services/activity-log-service';

export const metadata: Metadata = {
  title: 'System Activity Logs',
};

export default async function ActivityLogsPage() {
  const activityService = new ActivityLogService();
  const logs = await activityService.getActivityLogs().catch(() => []);

  const columns: Column<ActivityLogRecord>[] = [
    {
      header: 'Action Name',
      cell: (log) => <StatusBadge status={log.action} label={log.action} />,
    },
    {
      header: 'Entity Type',
      cell: (log) => <span className="font-mono text-xs text-muted-foreground">{log.entityType}</span>,
    },
    {
      header: 'Entity ID',
      cell: (log) => (
        <span className="font-mono text-xs text-muted-foreground">
          {log.entityId ? `#${log.entityId.slice(0, 8)}` : '—'}
        </span>
      ),
    },
    {
      header: 'Timestamp',
      cell: (log) => <DateDisplay date={log.createdAt} className="text-xs" />,
    },
  ];

  return (
    <DashboardShell
      heading="System Activity Logs"
      description="Immutable append-only audit trail of system events, operations, and financial transactions"
    >
      <DataTable
        columns={columns}
        data={logs}
        keyExtractor={(log) => log.id}
        emptyTitle="No activity logs recorded"
        emptyDescription="System actions and mutations will automatically generate audit logs here."
      />
    </DashboardShell>
  );
}
