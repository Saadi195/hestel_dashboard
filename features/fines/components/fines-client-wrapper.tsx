'use client';

import { Plus, DollarSign, ShieldAlert } from 'lucide-react';
import * as React from 'react';

import { CurrencyDisplay } from '@/components/shared/currency-display';
import { DataTable, type Column } from '@/components/shared/data-table';
import { DateDisplay } from '@/components/shared/date-display';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import type { Resident } from '@/domain/residents/entities';

import type { FineWithSummary } from '../services/fine-service';

import { CreateFineDialog } from './create-fine-dialog';
import { RecordFinePaymentDialog } from './record-fine-payment-dialog';
import { WaiveFineDialog } from './waive-fine-dialog';

export interface FinesClientWrapperProps {
  hostelId: string;
  fines: FineWithSummary[];
  residents: Resident[];
}

export function FinesClientWrapper({
  hostelId,
  fines,
  residents,
}: FinesClientWrapperProps) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [waiveOpen, setWaiveOpen] = React.useState(false);
  const [selectedFine, setSelectedFine] = React.useState<FineWithSummary | null>(null);

  const handleOpenPayment = (fine: FineWithSummary) => {
    setSelectedFine(fine);
    setPaymentOpen(true);
  };

  const handleOpenWaive = (fine: FineWithSummary) => {
    setSelectedFine(fine);
    setWaiveOpen(true);
  };

  const columns: Column<FineWithSummary>[] = [
    {
      header: 'Resident Name',
      cell: (f) => (
        <div>
          <span className="font-semibold">{f.residentName}</span>
          <p className="text-xs text-muted-foreground">Reason: {f.reason}</p>
        </div>
      ),
    },
    {
      header: 'Fine Amount',
      cell: (f) => <CurrencyDisplay amount={f.amount} className="font-medium" />,
    },
    {
      header: 'Paid to Date',
      cell: (f) => <CurrencyDisplay amount={f.totalPaid} className="text-emerald-600 font-medium" />,
    },
    {
      header: 'Remaining Balance',
      cell: (f) => (
        <CurrencyDisplay
          amount={f.remainingBalance}
          className={f.remainingBalance > 0 && !f.isWaived ? 'text-red-600 font-bold' : 'text-muted-foreground'}
        />
      ),
    },
    {
      header: 'Issued Date',
      cell: (f) => <DateDisplay date={f.createdAt} className="text-xs" />,
    },
    {
      header: 'Status',
      cell: (f) => <StatusBadge status={f.derivedStatus} />,
    },
    {
      header: 'Actions',
      cell: (f) =>
        f.remainingBalance > 0 && !f.isWaived ? (
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={() => handleOpenPayment(f)}>
              <DollarSign className="mr-1 h-3.5 w-3.5" />
              Pay
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleOpenWaive(f)}>
              <ShieldAlert className="mr-1 h-3.5 w-3.5 text-amber-500" />
              Waive
            </Button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            {f.isWaived ? 'Waived' : 'Paid'}
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="destructive" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Issue Fine
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={fines}
        keyExtractor={(f) => f.id}
        emptyTitle="No fines issued"
        emptyDescription="There are currently no disciplinary or late payment fines on record."
      />

      <CreateFineDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        hostelId={hostelId}
        residents={residents}
      />

      <RecordFinePaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        fine={selectedFine}
      />

      <WaiveFineDialog
        open={waiveOpen}
        onOpenChange={setWaiveOpen}
        fine={selectedFine}
      />
    </div>
  );
}
