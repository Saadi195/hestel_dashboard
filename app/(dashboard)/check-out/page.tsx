import type { Metadata } from 'next';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { CheckoutClientWrapper } from '@/features/check-out/components/checkout-client-wrapper';
import { CheckoutService } from '@/features/check-out/services/checkout-service';

export const metadata: Metadata = {
  title: 'Resident Checkout & Settlement',
};

export default async function CheckOutPage() {
  const checkoutService = new CheckoutService();
  const defaultHostelId = '00000000-0000-0000-0000-000000000001';

  const pendingCheckouts = await checkoutService.getPendingCheckouts(defaultHostelId).catch(() => []);

  return (
    <DashboardShell
      heading="Resident Checkout & Settlement"
      description="Review authoritative financial calculations, refund/amount due balances, and finalize historical checkout snapshots"
    >
      <CheckoutClientWrapper pendingCheckouts={pendingCheckouts} />
    </DashboardShell>
  );
}
