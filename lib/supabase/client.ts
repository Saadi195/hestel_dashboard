import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/lib/database/types';

/**
 * Creates a Supabase client for use in Client Components.
 *
 * Uses the public anon key — safe for browser use.
 * NEVER use the service role key in client-side code.
 */
export function createClient() {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const anonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

  if (!url || !anonKey) {
    throw new Error('Missing Supabase public environment variables');
  }

  return createBrowserClient<Database>(url, anonKey);
}
