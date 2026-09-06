'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { loginSchema } from '@/features/auth/schemas';
import { authService } from '@/features/auth/services/auth-service';
import { Role } from '@/lib/auth/roles';
import { withErrorHandling, type ActionResult } from '@/lib/errors/error-handler';

/**
 * Server Action: Sign in a user with email & password.
 */
export const signIn = withErrorHandling(
  async (formData: FormData): Promise<ActionResult<void>> => {
    const raw = {
      email: formData.get('email'),
      password: formData.get('password'),
    };

    const input = loginSchema.parse(raw);
    await authService.signIn(input);

    const cookieStore = await cookies();
    cookieStore.set('demo_user_role', Role.OWNER, { path: '/' });

    redirect('/dashboard');
  },
);

/**
 * Server Action: Quick demo sign-in for testing roles.
 */
export const demoSignIn = withErrorHandling(
  async (role: Role): Promise<ActionResult<void>> => {
    const cookieStore = await cookies();
    cookieStore.set('demo_user_role', role, { path: '/' });
    redirect('/dashboard');
  },
);

/**
 * Server Action: Sign out the current user.
 */
export const signOut = withErrorHandling(
  async (): Promise<ActionResult<void>> => {
    await authService.signOut();
    const cookieStore = await cookies();
    cookieStore.delete('demo_user_role');
    redirect('/login');
  },
);
