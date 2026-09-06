import type { Metadata } from 'next';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { SettingService } from '@/features/settings/services/setting-service';

export const metadata: Metadata = {
  title: 'Hostel Settings',
};

export default async function SettingsPage() {
  const settingService = new SettingService();
  const defaultHostelId = '00000000-0000-0000-0000-000000000001';

  const settings = await settingService.getSettings(defaultHostelId);

  return (
    <DashboardShell
      heading="Hostel Configuration & Settings"
      description="Manage business rules, notice periods, rent proration policies, and security deposit parameters"
    >
      <div className="max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Rules Configuration</CardTitle>
            <CardDescription>System-wide defaults for resident onboarding and checkout</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="font-semibold">Notice Period Duration</p>
                <p className="text-xs text-muted-foreground">Required advance notice period for resident checkout</p>
              </div>
              <span className="font-bold text-primary">{settings?.noticePeriodDays ?? 15} Days</span>
            </div>

            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="font-semibold">Default Security Deposit Amount</p>
                <p className="text-xs text-muted-foreground">Standard deposit required upon resident check-in</p>
              </div>
              <CurrencyDisplay amount={settings?.defaultSecurityDeposit ?? 20000} className="font-bold text-primary" />
            </div>

            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="font-semibold">Rent Proration Policy</p>
                <p className="text-xs text-muted-foreground">Proration calculation rule for mid-month check-ins</p>
              </div>
              <span className="font-mono text-xs font-bold bg-muted px-2 py-1 rounded">
                {settings?.rentProrationPolicy ?? 'FULL_MONTH'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Deposit Installment Limits</p>
                <p className="text-xs text-muted-foreground">Maximum allowed deposit payment installments</p>
              </div>
              <span className="font-bold text-primary">
                {settings?.allowDepositInstallments ? `${settings.maxDepositInstallments} Installments` : 'Disabled'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
