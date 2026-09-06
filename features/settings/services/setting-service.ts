import { requirePermission } from '@/lib/auth/session';
import { getTable } from '@/lib/supabase/db-helper';
import { createClient } from '@/lib/supabase/server';

export interface HostelSettingsRecord {
  id: string;
  hostelId: string;
  noticePeriodDays: number;
  defaultSecurityDeposit: number;
  allowDepositInstallments: boolean;
  maxDepositInstallments: number;
  rentProrationPolicy: string;
}

export class SettingService {
  async getSettings(hostelId: string): Promise<HostelSettingsRecord | null> {
    await requirePermission('settings.manage');
    const supabase = await createClient();

    const { data } = await supabase
      .from('hostel_settings')
      .select('*')
      .eq('hostel_id', hostelId)
      .maybeSingle();

    if (!data) {
      return {
        id: 'default',
        hostelId,
        noticePeriodDays: 15,
        defaultSecurityDeposit: 20000,
        allowDepositInstallments: true,
        maxDepositInstallments: 3,
        rentProrationPolicy: 'FULL_MONTH',
      };
    }

    const row = data as Record<string, unknown>;
    return {
      id: String(row.id),
      hostelId: String(row.hostel_id),
      noticePeriodDays: Number(row.notice_period_days),
      defaultSecurityDeposit: Number(row.default_security_deposit),
      allowDepositInstallments: Boolean(row.allow_deposit_installments),
      maxDepositInstallments: Number(row.max_deposit_installments),
      rentProrationPolicy: String(row.rent_proration_policy),
    };
  }

  async updateSettings(hostelId: string, settings: Partial<HostelSettingsRecord>) {
    const user = await requirePermission('settings.manage');
    const supabase = await createClient();

    const payload: Record<string, unknown> = {};
    if (settings.noticePeriodDays !== undefined) payload['notice_period_days'] = settings.noticePeriodDays;
    if (settings.defaultSecurityDeposit !== undefined) payload['default_security_deposit'] = settings.defaultSecurityDeposit;
    if (settings.allowDepositInstallments !== undefined) payload['allow_deposit_installments'] = settings.allowDepositInstallments;
    if (settings.maxDepositInstallments !== undefined) payload['max_deposit_installments'] = settings.maxDepositInstallments;
    if (settings.rentProrationPolicy !== undefined) payload['rent_proration_policy'] = settings.rentProrationPolicy;

    await getTable(supabase, 'hostel_settings').insert({
      hostel_id: hostelId,
      ...payload,
    });

    await getTable(supabase, 'activity_logs').insert({
      user_id: user.id,
      action: 'SETTINGS_UPDATED',
      entity_type: 'hostel_settings',
      entity_id: hostelId,
      metadata: payload,
    });
  }
}
