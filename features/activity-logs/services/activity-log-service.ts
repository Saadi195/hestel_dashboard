import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export interface ActivityLogRecord {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export class ActivityLogService {
  async getActivityLogs(): Promise<ActivityLogRecord[]> {
    await requirePermission('activity_logs.view');
    const supabase = await createClient();

    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    return (data ?? []).map((item) => {
      const log = item as Record<string, unknown>;
      return {
        id: String(log['id']),
        userId: log['user_id'] ? String(log['user_id']) : null,
        action: String(log['action']),
        entityType: String(log['entity_type']),
        entityId: log['entity_id'] ? String(log['entity_id']) : null,
        metadata: (log['metadata'] as Record<string, unknown>) ?? null,
        createdAt: String(log['created_at']),
      };
    });
  }
}
