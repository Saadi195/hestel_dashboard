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

import { createFineAction } from '../actions/fine-actions';

export interface CreateFineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hostelId: string;
  residents: Resident[];
}

export function CreateFineDialog({
  open,
  onOpenChange,
  hostelId,
  residents,
}: CreateFineDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [residentId, setResidentId] = React.useState(residents[0]?.id ?? '');
  const [amount, setAmount] = React.useState('1000');
  const [reason, setReason] = React.useState('');

  const hasResidents = residents.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    if (!residentId) {
      setErrorMsg('Please select a resident to issue the fine.');
      setIsLoading(false);
      return;
    }

    const res = await createFineAction({
      hostelId: hostelId || '00000000-0000-0000-0000-000000000001',
      residentId,
      amount: parseFloat(amount),
      reason,
    });

    setIsLoading(false);

    if (res.success) {
      onOpenChange(false);
      setReason('');
      router.refresh();
    } else {
      setErrorMsg(res.error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Issue Fine</DialogTitle>
        <DialogDescription>Issue a disciplinary or late payment penalty fine to a resident.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {errorMsg && (
          <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md border border-destructive/20">
            {errorMsg}
          </div>
        )}

        {!hasResidents ? (
          <div className="p-3 text-xs bg-amber-50 text-amber-700 rounded-md border border-amber-200">
            ⚠️ No residents found. Please register a resident first before issuing a fine.
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
          <label className="text-xs font-medium">Fine Amount (PKR) *</label>
          <Input
            type="number"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-medium">Reason for Fine *</label>
          <Input
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Curfew violation / Property damage"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="destructive" disabled={isLoading || !hasResidents}>
            {isLoading ? 'Issuing...' : 'Issue Fine'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
