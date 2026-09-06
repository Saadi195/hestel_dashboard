'use client';

import { Plus, XCircle } from 'lucide-react';
import * as React from 'react';

import { DataTable, type Column } from '@/components/shared/data-table';
import { DateDisplay } from '@/components/shared/date-display';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import type { Resident } from '@/domain/residents/entities';

import type { NoticeWithSummary } from '../services/notice-service';

import { CancelNoticeDialog } from './cancel-notice-dialog';
import { SubmitNoticeDialog } from './submit-notice-dialog';

export interface NoticesClientWrapperProps {
  hostelId: string;
  notices: NoticeWithSummary[];
  residents: Resident[];
}

export function NoticesClientWrapper({
  hostelId,
  notices,
  residents,
}: NoticesClientWrapperProps) {
  const [submitOpen, setSubmitOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [selectedNotice, setSelectedNotice] = React.useState<NoticeWithSummary | null>(null);

  const handleOpenCancel = (n: NoticeWithSummary) => {
    setSelectedNotice(n);
    setCancelOpen(true);
  };

  const columns: Column<NoticeWithSummary>[] = [
    {
      header: 'Resident Name',
      cell: (n) => (
        <div>
          <span className="font-semibold">{n.residentName}</span>
          {n.reason && <p className="text-xs text-muted-foreground">{n.reason}</p>}
        </div>
      ),
    },
    {
      header: 'Notice Date',
      cell: (n) => <DateDisplay date={n.noticeDate} className="text-xs font-medium" />,
    },
    {
      header: 'Notice Period',
      cell: (n) => <span className="text-xs font-medium">{n.requiredDays} Days</span>,
    },
    {
      header: 'Expected Checkout',
      cell: (n) => <DateDisplay date={n.expectedCheckoutDate} className="text-xs font-bold text-primary" />,
    },
    {
      header: 'Remaining Days',
      cell: (n) => (
        <span
          className={`text-xs font-bold ${
            n.remainingDays <= 3 ? 'text-red-600' : n.remainingDays <= 7 ? 'text-amber-600' : 'text-emerald-600'
          }`}
        >
          {n.status === 'SUBMITTED' ? `${n.remainingDays} Days` : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (n) => <StatusBadge status={n.status} />,
    },
    {
      header: 'Actions',
      cell: (n) =>
        n.status === 'SUBMITTED' ? (
          <Button size="sm" variant="outline" onClick={() => handleOpenCancel(n)}>
            <XCircle className="mr-1 h-3.5 w-3.5 text-red-500" />
            Cancel
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground italic">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setSubmitOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Submit Checkout Notice
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={notices}
        keyExtractor={(n) => n.id}
        emptyTitle="No notices registered"
        emptyDescription="There are currently no active resident checkout notices on record."
      />

      <SubmitNoticeDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        hostelId={hostelId}
        residents={residents}
      />

      <CancelNoticeDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        notice={selectedNotice}
      />
    </div>
  );
}
