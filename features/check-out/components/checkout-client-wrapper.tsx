'use client';

import { LogOut, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { CurrencyDisplay } from '@/components/shared/currency-display';
import { DateDisplay } from '@/components/shared/date-display';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

import { approveCheckoutAction } from '../actions/checkout-actions';
import type { ResidentCheckoutReview } from '../services/checkout-service';

export interface CheckoutClientWrapperProps {
  pendingCheckouts: ResidentCheckoutReview[];
}

export function CheckoutClientWrapper({ pendingCheckouts }: CheckoutClientWrapperProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleApprove = async (review: ResidentCheckoutReview) => {
    setLoadingId(review.residentId);
    setErrorMsg(null);

    const res = await approveCheckoutAction({
      settlementId: review.settlement?.id ?? '00000000-0000-0000-0000-000000000000',
      residentId: review.residentId,
    });

    setLoadingId(null);

    if (res.success) {
      router.refresh();
    } else {
      setErrorMsg(res.error.message);
    }
  };

  if (pendingCheckouts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No residents currently pending checkout or in notice period.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {errorMsg && (
        <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md border border-destructive/20">
          {errorMsg}
        </div>
      )}

      {pendingCheckouts.map((review) => {
        const { calculation } = review;
        const isRefund = calculation.refundableDeposit > 0;

        return (
          <Card key={review.residentId} className="border-2 shadow-sm">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center space-x-2">
                    <LogOut className="h-5 w-5 text-primary" />
                    <span>{review.residentName}</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Room {review.roomNumber} • Bed {review.bedNumber}
                  </CardDescription>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>Notice Date: <DateDisplay date={review.noticeDate} className="font-medium text-foreground" /></p>
                  <p>Expected Checkout: <DateDisplay date={review.expectedCheckoutDate} className="font-medium text-primary" /></p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Authoritative Financial Settlement Summary
              </h4>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-lg border bg-card space-y-2">
                  <p className="font-semibold text-xs text-muted-foreground">DEPOSIT BALANCE</p>
                  <div className="flex justify-between">
                    <span>Deposit Paid:</span>
                    <CurrencyDisplay amount={calculation.depositPaid} className="font-medium" />
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Approved Deductions:</span>
                    <span>- <CurrencyDisplay amount={calculation.depositDeductions} /></span>
                  </div>
                  <div className="flex justify-between border-t pt-1 font-semibold">
                    <span>Net Deposit Balance:</span>
                    <CurrencyDisplay amount={Math.max(0, calculation.depositPaid - calculation.depositDeductions)} />
                  </div>
                </div>

                <div className="p-3 rounded-lg border bg-card space-y-2">
                  <p className="font-semibold text-xs text-muted-foreground">OUTSTANDING LIABILITIES</p>
                  <div className="flex justify-between">
                    <span>Unpaid Rent Due:</span>
                    <CurrencyDisplay amount={calculation.totalRentDue} className="font-medium text-amber-600" />
                  </div>
                  <div className="flex justify-between">
                    <span>Unpaid Fines Due:</span>
                    <CurrencyDisplay amount={calculation.totalFinesDue} className="font-medium text-red-600" />
                  </div>
                  <div className="flex justify-between border-t pt-1 font-semibold">
                    <span>Total Liabilities:</span>
                    <CurrencyDisplay amount={calculation.totalRentDue + calculation.totalFinesDue} />
                  </div>
                </div>
              </div>

              {/* Settlement Outcome Box */}
              <div
                className={`p-4 rounded-xl border-2 flex items-center justify-between ${
                  isRefund
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-950 dark:text-red-300'
                }`}
              >
                <div>
                  <p className="text-xs font-bold uppercase">
                    {isRefund ? 'REFUND TO RESIDENT' : 'AMOUNT DUE FROM RESIDENT'}
                  </p>
                  <p className="text-2xl font-extrabold mt-1">
                    <CurrencyDisplay
                      amount={isRefund ? calculation.refundableDeposit : calculation.netAmountDue}
                    />
                  </p>
                </div>

                <Button
                  size="lg"
                  className={isRefund ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
                  disabled={loadingId === review.residentId}
                  onClick={() => handleApprove(review)}
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  {loadingId === review.residentId ? 'Finalizing...' : 'Approve Settlement & Check-Out'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
