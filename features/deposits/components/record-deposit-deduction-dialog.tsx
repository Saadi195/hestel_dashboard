'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { CurrencyDisplay } from '@/components/shared/currency-display';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import { recordDepositDeductionAction } from '../actions/deposit-actions';
import type { SecurityDepositWithSummary } from '../services/deposit-service';

export interface RecordDepositDeductionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deposit: SecurityDepositWithSummary | null;
}

export function RecordDepositDeductionDialog({
  open,
  onOpenChange,
  deposit,
}: RecordDepositDeductionDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [amount, setAmount] = React.useState('');
  const [reason, setReason] = React.useState('');

  if (!deposit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const res = await recordDepositDeductionAction({
      securityDepositId: deposit.id,
      residentId: deposit.residentId,
      amount: parseFloat(amount),
      reason,
    });

    setIsLoading(false);

    if (res.success) {
      onOpenChange(false);
      setAmount('');
      setReason('');
      router.refresh();
    } else {
      setErrorMsg(res.error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Record Deposit Deduction</DialogTitle>
        <DialogDescription>
          Record approved damage/penalty deduction from <span className="font-semibold">{deposit.residentName}</span>'s deposit.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {errorMsg && (
          <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md border border-destructive/20">
            {errorMsg}
          </div>
        )}

        <div className="p-3 bg-muted rounded-md text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Available Net Balance:</span>
            <CurrencyDisplay amount={deposit.netAvailableBalance} className="font-bold text-emerald-600" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium">Deduction Amount (PKR) *</label>
          <Input
            type="number"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-medium">Deduction Reason / Authorization *</label>
          <Input
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Room furniture damage compensation"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="destructive" disabled={isLoading}>
            {isLoading ? 'Recording...' : 'Record Deduction'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
