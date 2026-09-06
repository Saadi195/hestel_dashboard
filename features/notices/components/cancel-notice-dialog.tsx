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

import { cancelNoticeAction } from '../actions/notice-actions';
import type { NoticeWithSummary } from '../services/notice-service';

export interface CancelNoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notice: NoticeWithSummary | null;
}

export function CancelNoticeDialog({ open, onOpenChange, notice }: CancelNoticeDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [cancellationReason, setCancellationReason] = React.useState('');

  if (!notice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const res = await cancelNoticeAction({
      noticeId: notice.id,
      cancellationReason,
    });

    setIsLoading(false);

    if (res.success) {
      onOpenChange(false);
      setCancellationReason('');
      router.refresh();
    } else {
      setErrorMsg(res.error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Cancel Checkout Notice</DialogTitle>
        <DialogDescription>
          Cancel notice for <span className="font-semibold">{notice.residentName}</span> and restore active status.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {errorMsg && (
          <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md border border-destructive/20">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="text-xs font-medium">Cancellation Reason *</label>
          <Input
            required
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="e.g. Resident decided to extend stay"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="submit" variant="destructive" disabled={isLoading}>
            {isLoading ? 'Cancelling...' : 'Cancel Notice'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
