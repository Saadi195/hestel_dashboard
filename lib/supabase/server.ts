import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from '@/lib/database/types';

const DEFAULT_SUPABASE_URL = 'https://lorxbxobtojhsrjrspwk.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_J9ldXUtNfsG53lq0pAEcOQ_dafdJk5M';

/**
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] || DEFAULT_SUPABASE_URL;
  const anonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || DEFAULT_SUPABASE_ANON_KEY;

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // ignore from Server Components
          }
        },
      },
    },
  );
}

/**
 * Creates a Supabase admin client using the service role key.
 */
export async function createAdminClient() {
  const cookieStore = await cookies();

  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] || DEFAULT_SUPABASE_URL;
  const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || DEFAULT_SUPABASE_ANON_KEY;

  return createServerClient<Database>(
    url,
    serviceKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // ignore from Server Components
          }
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
