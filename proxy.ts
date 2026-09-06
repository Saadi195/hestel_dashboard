import { type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/proxy';

/**
 * Public routes that do not require authentication.
 * All other routes under (dashboard) are automatically protected.
 */
const PUBLIC_ROUTES = ['/login', '/api/health'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes without auth check
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // Always refresh the session cookie (required by Supabase SSR)
  const response = await updateSession(request);

  if (isPublicRoute) {
    return response;
  }

  // Check if session exists for protected routes
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     * - api/health (uptime check)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
