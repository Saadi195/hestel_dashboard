'use client';

import { DollarSign, Plus } from 'lucide-react';
import * as React from 'react';

import { CurrencyDisplay } from '@/components/shared/currency-display';
import { DataTable, type Column } from '@/components/shared/data-table';
import { DateDisplay } from '@/components/shared/date-display';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import type { Resident } from '@/domain/residents/entities';

import type { RentChargeWithStatus } from '../services/rent-service';

import { CreateRentChargeDialog } from './create-rent-charge-dialog';
import { RecordPaymentDialog } from './record-payment-dialog';

export interface PaymentsClientWrapperProps {
  hostelId: string;
  charges: RentChargeWithStatus[];
  residents: Resident[];
}

export function PaymentsClientWrapper({
  hostelId,
  charges,
  residents,
}: PaymentsClientWrapperProps) {
  const [chargeOpen, setChargeOpen] = React.useState(false);
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [selectedCharge, setSelectedCharge] = React.useState<RentChargeWithStatus | null>(null);

  const handleOpenPayment = (charge: RentChargeWithStatus) => {
    setSelectedCharge(charge);
    setPaymentOpen(true);
  };

  const columns: Column<RentChargeWithStatus>[] = [
    {
      header: 'Resident Name',
      cell: (c) => (
        <div>
          <span className="font-semibold">{c.residentName}</span>
          <p className="text-xs text-muted-foreground">Period: {c.billingPeriod}</p>
        </div>
      ),
    },
    {
      header: 'Charge Amount',
      cell: (c) => <CurrencyDisplay amount={c.amount} className="font-medium" />,
    },
    {
      header: 'Total Paid',
      cell: (c) => <CurrencyDisplay amount={c.totalPaid} className="text-emerald-600 font-medium" />,
    },
    {
      header: 'Outstanding Balance',
      cell: (c) => (
        <CurrencyDisplay
          amount={c.outstandingBalance}
          className={c.outstandingBalance > 0 ? 'text-amber-600 font-bold' : 'text-muted-foreground'}
        />
      ),
    },
    {
      header: 'Due Date',
      cell: (c) => <DateDisplay date={c.dueDate} className="text-xs" />,
    },
    {
      header: 'Derived Status',
      cell: (c) => <StatusBadge status={c.derivedStatus} />,
    },
    {
      header: 'Action',
      cell: (c) =>
        c.outstandingBalance > 0 ? (
          <Button size="sm" onClick={() => handleOpenPayment(c)}>
            <DollarSign className="mr-1 h-3.5 w-3.5" />
            Pay
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground italic">Fully Paid</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end space-x-3">
        <Button onClick={() => setChargeOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Generate Rent Charge
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={charges}
        keyExtractor={(c) => c.id}
        emptyTitle="No rent charges issued"
        emptyDescription="Get started by generating your first monthly rent charge."
      />

      <CreateRentChargeDialog
        open={chargeOpen}
        onOpenChange={setChargeOpen}
        hostelId={hostelId}
        residents={residents}
      />

      <RecordPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        charge={selectedCharge}
      />
    </div>
  );
}
