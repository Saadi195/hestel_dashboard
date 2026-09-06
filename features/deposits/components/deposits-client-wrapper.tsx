'use client';

import { Plus, DollarSign, MinusCircle } from 'lucide-react';
import * as React from 'react';

import { CurrencyDisplay } from '@/components/shared/currency-display';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import type { Resident } from '@/domain/residents/entities';

import type { SecurityDepositWithSummary } from '../services/deposit-service';

import { CreateDepositDialog } from './create-deposit-dialog';
import { RecordDepositDeductionDialog } from './record-deposit-deduction-dialog';
import { RecordDepositPaymentDialog } from './record-deposit-payment-dialog';

export interface DepositsClientWrapperProps {
  hostelId: string;
  deposits: SecurityDepositWithSummary[];
  residents: Resident[];
}

export function DepositsClientWrapper({
  hostelId,
  deposits,
  residents,
}: DepositsClientWrapperProps) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [deductionOpen, setDeductionOpen] = React.useState(false);
  const [selectedDeposit, setSelectedDeposit] = React.useState<SecurityDepositWithSummary | null>(null);

  const handleOpenPayment = (dep: SecurityDepositWithSummary) => {
    setSelectedDeposit(dep);
    setPaymentOpen(true);
  };

  const handleOpenDeduction = (dep: SecurityDepositWithSummary) => {
    setSelectedDeposit(dep);
    setDeductionOpen(true);
  };

  const columns: Column<SecurityDepositWithSummary>[] = [
    {
      header: 'Resident Name',
      cell: (d) => <span className="font-semibold">{d.residentName}</span>,
    },
    {
      header: 'Required Deposit',
      cell: (d) => <CurrencyDisplay amount={d.requiredAmount} className="font-medium" />,
    },
    {
      header: 'Paid to Date',
      cell: (d) => <CurrencyDisplay amount={d.totalPaid} className="text-emerald-600 font-medium" />,
    },
    {
      header: 'Approved Deductions',
      cell: (d) => <CurrencyDisplay amount={d.totalDeductions} className="text-red-600 font-medium" />,
    },
    {
      header: 'Net Available Balance',
      cell: (d) => (
        <CurrencyDisplay amount={d.netAvailableBalance} className="font-bold text-primary" />
      ),
    },
    {
      header: 'Actions',
      cell: (d) => (
        <div className="flex items-center space-x-2">
          {d.remainingRequired > 0 && (
            <Button size="sm" onClick={() => handleOpenPayment(d)}>
              <DollarSign className="mr-1 h-3.5 w-3.5" />
              Pay
            </Button>
          )}
          {d.netAvailableBalance > 0 && (
            <Button size="sm" variant="outline" onClick={() => handleOpenDeduction(d)}>
              <MinusCircle className="mr-1 h-3.5 w-3.5 text-red-500" />
              Deduct
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Setup Security Deposit
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={deposits}
        keyExtractor={(d) => d.id}
        emptyTitle="No security deposits configured"
        emptyDescription="Get started by setting up deposit requirements for residents."
      />

      <CreateDepositDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        hostelId={hostelId}
        residents={residents}
      />

      <RecordDepositPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        deposit={selectedDeposit}
      />

      <RecordDepositDeductionDialog
        open={deductionOpen}
        onOpenChange={setDeductionOpen}
        deposit={selectedDeposit}
      />
    </div>
  );
}
