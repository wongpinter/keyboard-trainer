// Base error interface for the application
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp?: Date;
}

// Custom error classes for different types of errors
export class BaseAppError extends Error implements AppError {
  public readonly code: string;
  public readonly details?: unknown;
  public readonly timestamp: Date;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): AppError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

// Authentication related errors
export class AuthenticationError extends BaseAppError {
  constructor(message: string, details?: unknown) {
    super('AUTH_ERROR', message, details);
  }
}

export class AuthorizationError extends BaseAppError {
  constructor(message: string, details?: unknown) {
    super('AUTHORIZATION_ERROR', message, details);
  }
}

// Validation errors
export class ValidationError extends BaseAppError {
  public readonly field?: string;

  constructor(message: string, field?: string, details?: unknown) {
    super('VALIDATION_ERROR', message, details);
    this.field = field;
  }
}

// Network and API errors
export class NetworkError extends BaseAppError {
  public readonly status?: number;
  public readonly url?: string;

  constructor(message: string, status?: number, url?: string, details?: unknown) {
    super('NETWORK_ERROR', message, details);
    this.status = status;
    this.url = url;
  }
}

export class APIError extends BaseAppError {
  public readonly status: number;
  public readonly endpoint: string;

  constructor(message: string, status: number, endpoint: string, details?: unknown) {
    super('API_ERROR', message, details);
    this.status = status;
    this.endpoint = endpoint;
  }
}

// Database errors
export class DatabaseError extends BaseAppError {
  constructor(message: string, details?: unknown) {
    super('DATABASE_ERROR', message, details);
  }
}

// Typing/Training specific errors
export class TypingError extends BaseAppError {
  constructor(message: string, details?: unknown) {
    super('TYPING_ERROR', message, details);
  }
}

export class KeyboardLayoutError extends BaseAppError {
  constructor(message: string, details?: unknown) {
    super('KEYBOARD_LAYOUT_ERROR', message, details);
  }
}

// Configuration errors
export class ConfigurationError extends BaseAppError {
  constructor(message: string, details?: unknown) {
    super('CONFIGURATION_ERROR', message, details);
  }
}

// Error type guards
export const isAppError = (error: unknown): error is BaseAppError => {
  return error instanceof BaseAppError;
};

export const isAuthenticationError = (error: unknown): error is AuthenticationError => {
  return error instanceof AuthenticationError;
};

export const isValidationError = (error: unknown): error is ValidationError => {
  return error instanceof ValidationError;
};

export const isNetworkError = (error: unknown): error is NetworkError => {
  return error instanceof NetworkError;
};

export const isAPIError = (error: unknown): error is APIError => {
  return error instanceof APIError;
};

// Error code mappings for user-friendly messages
export const ERROR_MESSAGES: Record<string, string> = {
  // Authentication
  'AUTH_ERROR': 'Authentication failed. Please check your credentials.',
  'AUTHORIZATION_ERROR': 'You do not have permission to perform this action.',
  'INVALID_EMAIL': 'Please enter a valid email address.',
  'WEAK_PASSWORD': 'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers.',
  'EMAIL_NOT_CONFIRMED': 'Please check your email and click the confirmation link.',
  'USER_NOT_FOUND': 'No account found with this email address.',
  'INVALID_CREDENTIALS': 'Invalid email or password.',
  'EMAIL_ALREADY_EXISTS': 'An account with this email already exists.',

  // Validation
  'VALIDATION_ERROR': 'Please check your input and try again.',
  'REQUIRED_FIELD': 'This field is required.',
  'INVALID_FORMAT': 'Please enter a valid format.',

  // Network
  'NETWORK_ERROR': 'Network connection failed. Please check your internet connection.',
  'TIMEOUT_ERROR': 'Request timed out. Please try again.',
  'SERVER_ERROR': 'Server error occurred. Please try again later.',

  // Database
  'DATABASE_ERROR': 'Database operation failed. Please try again.',
  'RECORD_NOT_FOUND': 'The requested record was not found.',
  'DUPLICATE_RECORD': 'A record with this information already exists.',

  // Typing/Training
  'TYPING_ERROR': 'An error occurred during typing practice.',
  'KEYBOARD_LAYOUT_ERROR': 'Invalid keyboard layout configuration.',
  'LESSON_NOT_FOUND': 'The requested lesson was not found.',
  'PROGRESS_SAVE_ERROR': 'Failed to save your progress. Please try again.',

  // Configuration
  'CONFIGURATION_ERROR': 'Application configuration error.',
  'MISSING_ENV_VAR': 'Required environment variable is missing.',

  // Generic
  'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.',
};

// Helper function to get user-friendly error message
export const getErrorMessage = (error: unknown): string => {
  if (isAppError(error)) {
    return ERROR_MESSAGES[error.code] || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
};

// Helper function to create error from Supabase error
export const createErrorFromSupabase = (error: any): BaseAppError => {
  const message = error?.message || 'Unknown database error';
  const code = error?.code || 'UNKNOWN_ERROR';

  // Map common Supabase error codes to our error types
  switch (code) {
    case 'invalid_credentials':
      return new AuthenticationError(ERROR_MESSAGES.INVALID_CREDENTIALS, error);
    case 'email_not_confirmed':
      return new AuthenticationError(ERROR_MESSAGES.EMAIL_NOT_CONFIRMED, error);
    case 'user_not_found':
      return new AuthenticationError(ERROR_MESSAGES.USER_NOT_FOUND, error);
    case 'email_address_invalid':
      return new ValidationError(ERROR_MESSAGES.INVALID_EMAIL, 'email', error);
    case 'password_too_short':
      return new ValidationError(ERROR_MESSAGES.WEAK_PASSWORD, 'password', error);
    case 'email_address_not_authorized':
      return new AuthorizationError('Email address not authorized', error);
    case 'PGRST116': // Row not found
      return new DatabaseError(ERROR_MESSAGES.RECORD_NOT_FOUND, error);
    case '23505': // Unique violation
      return new DatabaseError(ERROR_MESSAGES.DUPLICATE_RECORD, error);
    default:
      return new DatabaseError(message, error);
  }
};

// Helper function to log errors (can be extended to send to error reporting service)
export const logError = (error: unknown, context?: string): void => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    error: isAppError(error) ? error.toJSON() : {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
  };

  console.error('Application Error:', errorInfo);

  // In production, you might want to send this to an error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to error reporting service
    // errorReportingService.captureException(error, { extra: errorInfo });
  }
};
