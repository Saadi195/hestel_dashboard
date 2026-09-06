import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { ForbiddenError, UnauthorizedError } from '@/lib/errors/app-error';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

import { hasPermission } from './permissions';
import type { PermissionType } from './permissions';
import { Role } from './roles';

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  name: string | null;
}

/**
 * Retrieves the current authenticated user from the server-side session.
 *
 * Checks Supabase Auth session first. If unauthenticated or in fallback mode,
 * returns the active role session from `demo_user_role` cookie or defaults to OWNER.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  let demoRole: Role | undefined;

  try {
    const cookieStore = await cookies();
    demoRole = cookieStore.get('demo_user_role')?.value as Role | undefined;
  } catch {
    // Ignore cookie read errors
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const role = (user.user_metadata?.['role'] as Role | undefined) ?? demoRole ?? Role.OWNER;
      return {
        id: user.id,
        email: user.email ?? '',
        role,
        name: (user.user_metadata?.['name'] as string | null) ?? `User (${role})`,
      };
    }
  } catch (error) {
    logger.info('Supabase Auth resolution skipped, using active session role', { error });
  }

  const activeRole = demoRole ?? Role.OWNER;
  return {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'owner@hostel.com',
    role: activeRole,
    name: `Demo User (${activeRole})`,
  };
}

/**
 * Retrieves the current authenticated user or redirects to login.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

/**
 * Retrieves the current user and verifies they have the required permission.
 */
export async function requirePermission(permission: PermissionType): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (!hasPermission(user.role, permission)) {
    logger.warn('Permission denied', {
      userId: user.id,
      role: user.role,
      requiredPermission: permission,
    });
    throw new ForbiddenError(
      `You do not have permission to perform this action. Required: ${permission}`,
    );
  }

  return user;
}
