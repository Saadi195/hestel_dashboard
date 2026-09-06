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

import { waiveFineAction } from '../actions/fine-actions';
import type { FineWithSummary } from '../services/fine-service';

export interface WaiveFineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fine: FineWithSummary | null;
}

export function WaiveFineDialog({ open, onOpenChange, fine }: WaiveFineDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [waiverReason, setWaiverReason] = React.useState('');

  if (!fine) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const res = await waiveFineAction({
      fineId: fine.id,
      waiverReason,
    });

    setIsLoading(false);

    if (res.success) {
      onOpenChange(false);
      setWaiverReason('');
      router.refresh();
    } else {
      setErrorMsg(res.error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Waive Fine</DialogTitle>
        <DialogDescription>
          Waive outstanding fine for <span className="font-semibold">{fine.residentName}</span>. Requires management authorization.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {errorMsg && (
          <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md border border-destructive/20">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="text-xs font-medium">Waiver Justification / Reason *</label>
          <Input
            required
            value={waiverReason}
            onChange={(e) => setWaiverReason(e.target.value)}
            placeholder="e.g. Approved by Hostel Manager due to medical emergency"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="destructive" disabled={isLoading}>
            {isLoading ? 'Waiving...' : 'Confirm Fine Waiver'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
