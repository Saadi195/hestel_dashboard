import { ZodError } from 'zod';

import { logger } from '@/lib/logger';

import {
  InternalError,
  ValidationError,
  isAppError,
} from './app-error';

/**
 * Standard Server Action response shape.
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: ActionError };

export interface ActionError {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

/**
 * Wraps a Server Action handler with centralized error handling.
 *
 * Rethrows Next.js redirect exceptions so redirects work seamlessly.
 */
export function withErrorHandling<TArgs extends unknown[], TReturn>(
  handler: (...args: TArgs) => Promise<ActionResult<TReturn>>,
): (...args: TArgs) => Promise<ActionResult<TReturn>> {
  return async (...args: TArgs): Promise<ActionResult<TReturn>> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'digest' in error &&
        typeof (error as { digest?: unknown }).digest === 'string' &&
        ((error as { digest: string }).digest).startsWith('NEXT_REDIRECT')
      ) {
        throw error;
      }
      return { success: false, error: toActionError(error) };
    }
  };
}

/**
 * Converts any thrown error into a safe ActionError for client consumption.
 */
export function toActionError(error: unknown): ActionError {
  if (isAppError(error)) {
    if (!error.isOperational) {
      logger.error('Unhandled operational error', { error });
    }

    if (error instanceof ValidationError && error.fields !== undefined) {
      return {
        code: error.code,
        message: error.message,
        fields: error.fields,
      };
    }

    return {
      code: error.code,
      message: error.message,
    };
  }

  if (error instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    const messages: string[] = [];
    for (const issue of error.issues) {
      const path = issue.path.join('.');
      if (path) {
        if (!fields[path]) {
          fields[path] = [];
        }
        fields[path].push(issue.message);
        messages.push(`${path}: ${issue.message}`);
      } else {
        messages.push(issue.message);
      }
    }

    const detailedMsg = messages.length > 0
      ? `Validation failed (${messages.join(' | ')})`
      : 'Please check the form for errors.';

    return {
      code: 'VALIDATION_ERROR',
      message: detailedMsg,
      fields,
    };
  }

  if (error instanceof Error) {
    logger.error('Error in Server Action', { message: error.message, stack: error.stack });
    return {
      code: 'SERVER_ERROR',
      message: error.message || 'An error occurred while saving form data.',
    };
  }

  logger.error('Unexpected error in Server Action', { error });

  const internalError = new InternalError(
    typeof error === 'string' ? error : 'An unexpected error occurred while saving data.',
  );
  return {
    code: internalError.code,
    message: internalError.message,
  };
}
