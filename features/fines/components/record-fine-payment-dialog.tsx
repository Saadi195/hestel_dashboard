'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PaymentMethod } from '@/domain/payments/entities';

import { recordFinePaymentAction } from '../actions/fine-actions';
import type { FineWithSummary } from '../services/fine-service';

export interface RecordFinePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fine: FineWithSummary | null;
}

export function RecordFinePaymentDialog({
  open,
  onOpenChange,
  fine,
}: RecordFinePaymentDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const defaultAmount = fine ? String(fine.remainingBalance) : '';
  const [customAmount, setCustomAmount] = React.useState<string | null>(null);
  const amount = customAmount ?? defaultAmount;

  const [paymentDate, setPaymentDate] = React.useState(new Date().toISOString().split('T')[0] ?? '');
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>(PaymentMethod.CASH);
  const [referenceNumber, setReferenceNumber] = React.useState('');
  const [notes, setNotes] = React.useState('');

  if (!fine) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const res = await recordFinePaymentAction({
      fineId: fine.id,
      residentId: fine.residentId,
      amount: parseFloat(amount),
      paymentDate,
      paymentMethod,
      referenceNumber: referenceNumber || undefined,
      notes: notes || undefined,
    });

    setIsLoading(false);

    if (res.success) {
      onOpenChange(false);
      setCustomAmount(null);
      setReferenceNumber('');
      setNotes('');
      router.refresh();
    } else {
      setErrorMsg(res.error.message);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) setCustomAmount(null);
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogHeader>
        <DialogTitle>Record Fine Payment</DialogTitle>
        <DialogDescription>
          Record fine payment for <span className="font-semibold">{fine.residentName}</span> (Fine: {fine.reason}).
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {errorMsg && (
          <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md border border-destructive/20">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Payment Amount (PKR) *</label>
            <Input
              type="number"
              required
              value={amount}
              onChange={(e) => setCustomAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Payment Date *</label>
            <Input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Payment Method *</label>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              <option value={PaymentMethod.CASH}>CASH</option>
              <option value={PaymentMethod.BANK_TRANSFER}>BANK_TRANSFER</option>
              <option value={PaymentMethod.EASYPAISA}>EASYPAISA</option>
              <option value={PaymentMethod.JAZZCASH}>JAZZCASH</option>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium">Tx / Ref Number</label>
            <Input
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. FINE-1234"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium">Notes</label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional remarks"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
