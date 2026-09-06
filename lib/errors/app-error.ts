/**
 * Base application error class.
 *
 * All custom errors in this application extend AppError.
 * This ensures consistent error handling and user-facing messages.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, code: string, statusCode: number, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace in V8
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 — Input validation failed.
 * Thrown when Zod schema validation fails or input is malformed.
 */
export class ValidationError extends AppError {
  public readonly fields: Record<string, string[]> | undefined;

  constructor(message: string, fields?: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', 400);
    this.fields = fields;
  }
}

/**
 * 401 — User is not authenticated.
 * Thrown when an action requires login but no session exists.
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

/**
 * 403 — User is authenticated but lacks permission.
 * Thrown when RBAC check fails.
 */
export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 'FORBIDDEN', 403);
  }
}

/**
 * 404 — Requested resource not found.
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with ID "${id}" was not found`
      : `${resource} was not found`;
    super(message, 'NOT_FOUND', 404);
  }
}

/**
 * 409 — Resource conflict (e.g., duplicate record, bed already occupied).
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}

/**
 * 422 — Business rule violation.
 * Thrown when an operation violates a domain rule (e.g., checkout before notice period).
 */
export class BusinessRuleError extends AppError {
  public readonly rule: string;

  constructor(message: string, rule: string) {
    super(message, 'BUSINESS_RULE_VIOLATION', 422);
    this.rule = rule;
  }
}

/**
 * 500 — Internal server error.
 * Should not expose internal details to users.
 */
export class InternalError extends AppError {
  constructor(message = 'An unexpected error occurred. Please try again.') {
    super(message, 'INTERNAL_ERROR', 500, false);
  }
}

/**
 * Type guard to check if an error is an AppError.
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
