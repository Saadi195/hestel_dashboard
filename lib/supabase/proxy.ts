import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import type { Database } from '@/lib/database/types';

const DEFAULT_SUPABASE_URL = 'https://lorxbxobtojhsrjrspwk.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_J9ldXUtNfsG53lq0pAEcOQ_dafdJk5M';

/**
 * Updates the Supabase session cookie in the proxy / middleware.
 * Keeps auth sessions and demo role sessions alive.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] || DEFAULT_SUPABASE_URL;
  const anonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || DEFAULT_SUPABASE_ANON_KEY;

  const supabase = createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase auth user lookup fallback
  }

  const hasDemoSession = request.cookies.has('demo_user_role');
  const isAuthenticated = Boolean(user || hasDemoSession);

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith('/login');
  const isDashboardRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/residents') ||
    pathname.startsWith('/rooms') ||
    pathname.startsWith('/beds') ||
    pathname.startsWith('/check-in') ||
    pathname.startsWith('/check-out') ||
    pathname.startsWith('/notices') ||
    pathname.startsWith('/payments') ||
    pathname.startsWith('/deposits') ||
    pathname.startsWith('/fines') ||
    pathname.startsWith('/expenses') ||
    pathname.startsWith('/complaints') ||
    pathname.startsWith('/visitors') ||
    pathname.startsWith('/employees') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/activity-logs') ||
    pathname.startsWith('/settings');

  // Redirect unauthenticated users away from protected routes
  if (!isAuthenticated && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth routes
  if (isAuthenticated && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
