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
import type { Resident } from '@/domain/residents/entities';

import { createRentChargeAction } from '../actions/payment-actions';

export interface CreateRentChargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hostelId: string;
  residents: Resident[];
}

export function CreateRentChargeDialog({
  open,
  onOpenChange,
  hostelId,
  residents,
}: CreateRentChargeDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [residentId, setResidentId] = React.useState(residents[0]?.id ?? '');
  const [billingPeriod, setBillingPeriod] = React.useState(
    new Date().toISOString().slice(0, 7),
  );
  const [amount, setAmount] = React.useState('15000');
  const [dueDate, setDueDate] = React.useState(new Date().toISOString().split('T')[0] ?? '');

  const hasResidents = residents.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    if (!residentId) {
      setErrorMsg('Please select a resident to generate the rent charge.');
      setIsLoading(false);
      return;
    }

    const res = await createRentChargeAction({
      hostelId: hostelId || '00000000-0000-0000-0000-000000000001',
      residentId,
      billingPeriod,
      amount: parseFloat(amount),
      dueDate,
    });

    setIsLoading(false);

    if (res.success) {
      onOpenChange(false);
      router.refresh();
    } else {
      setErrorMsg(res.error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Generate Rent Charge</DialogTitle>
        <DialogDescription>Create a new monthly rent charge for a resident.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {errorMsg && (
          <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md border border-destructive/20">
            {errorMsg}
          </div>
        )}

        {!hasResidents ? (
          <div className="p-3 text-xs bg-amber-50 text-amber-700 rounded-md border border-amber-200">
            ⚠️ No residents found. Please register a resident first before generating a rent charge.
          </div>
        ) : (
          <div>
            <label className="text-xs font-medium">Select Resident *</label>
            <Select value={residentId} onChange={(e) => setResidentId(e.target.value)}>
              {residents.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.fullName} ({r.phone})
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Billing Period (YYYY-MM) *</label>
            <Input
              required
              value={billingPeriod}
              onChange={(e) => setBillingPeriod(e.target.value)}
              placeholder="2026-08"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Rent Amount (PKR) *</label>
            <Input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium">Due Date *</label>
          <Input
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !hasResidents}>
            {isLoading ? 'Generating...' : 'Generate Charge'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
