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

import { createDepositAction } from '../actions/deposit-actions';

export interface CreateDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hostelId: string;
  residents: Resident[];
}

export function CreateDepositDialog({
  open,
  onOpenChange,
  hostelId,
  residents,
}: CreateDepositDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [residentId, setResidentId] = React.useState(residents[0]?.id ?? '');
  const [requiredAmount, setRequiredAmount] = React.useState('20000');

  const hasResidents = residents.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    if (!residentId) {
      setErrorMsg('Please select a resident to set up the deposit.');
      setIsLoading(false);
      return;
    }

    const res = await createDepositAction({
      hostelId: hostelId || '00000000-0000-0000-0000-000000000001',
      residentId,
      requiredAmount: parseFloat(requiredAmount),
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
        <DialogTitle>Setup Security Deposit</DialogTitle>
        <DialogDescription>Assign required security deposit amount for a resident.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {errorMsg && (
          <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md border border-destructive/20">
            {errorMsg}
          </div>
        )}

        {!hasResidents ? (
          <div className="p-3 text-xs bg-amber-50 text-amber-700 rounded-md border border-amber-200">
            ⚠️ No residents found. Please register a resident first before setting up a deposit.
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

        <div>
          <label className="text-xs font-medium">Required Security Deposit (PKR) *</label>
          <Input
            type="number"
            required
            value={requiredAmount}
            onChange={(e) => setRequiredAmount(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !hasResidents}>
            {isLoading ? 'Setting Up...' : 'Setup Deposit'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
