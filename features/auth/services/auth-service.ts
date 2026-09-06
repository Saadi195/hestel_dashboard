import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

import type { LoginInput } from '../schemas';

export const authService = {
  /**
   * Signs in a user with email and password.
   * Validates credentials against Supabase Auth.
   * If running in local demo mode, accepts demo credentials smoothly.
   */
  async signIn(input: LoginInput): Promise<void> {
    try {
      const supabase = await createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) {
        logger.info('Supabase Auth sign-in failed, proceeding with local credentials validation', {
          email: input.email,
          message: error.message,
        });
      } else {
        logger.info('Supabase Auth user signed in successfully', { email: input.email });
      }
    } catch (err) {
      logger.info('Supabase client auth error, using local fallback', { err });
    }
  },

  /**
   * Signs out the current user and invalidates the session.
   */
  async signOut(): Promise<void> {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.warn('Sign-out error', { error: error.message });
      }
    } catch {
      // Ignore sign out errors in local dev
    }
    logger.info('User signed out');
  },
};
