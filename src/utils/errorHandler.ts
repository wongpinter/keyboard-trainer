import React from 'react';
import { toast } from '@/hooks/use-toast';
import { 
  BaseAppError, 
  getErrorMessage, 
  logError, 
  createErrorFromSupabase,
  isAuthenticationError,
  isValidationError,
  isNetworkError,
  isAPIError
} from '@/types/errors';

// Configuration for error handling
interface ErrorHandlerConfig {
  showToast?: boolean;
  logError?: boolean;
  redirectOnAuth?: boolean;
  context?: string;
}

// Default configuration
const DEFAULT_CONFIG: ErrorHandlerConfig = {
  showToast: true,
  logError: true,
  redirectOnAuth: false,
};

// Main error handler function
export const handleError = (
  error: unknown, 
  config: ErrorHandlerConfig = {}
): BaseAppError => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Convert to our error type if needed
  let appError: BaseAppError;
  
  if (error instanceof BaseAppError) {
    appError = error;
  } else if (typeof error === 'object' && error !== null && 'code' in error) {
    // Likely a Supabase error
    appError = createErrorFromSupabase(error);
  } else {
    // Generic error
    const message = error instanceof Error ? error.message : String(error);
    appError = new BaseAppError('UNKNOWN_ERROR', message, error);
  }

  // Log the error if configured
  if (finalConfig.logError) {
    logError(appError, finalConfig.context);
  }

  // Show toast notification if configured
  if (finalConfig.showToast) {
    showErrorToast(appError);
  }

  // Handle authentication errors
  if (finalConfig.redirectOnAuth && isAuthenticationError(appError)) {
    // Redirect to login page after a short delay
    setTimeout(() => {
      window.location.href = '/auth';
    }, 2000);
  }

  return appError;
};

// Show appropriate toast based on error type
const showErrorToast = (error: BaseAppError): void => {
  const message = getErrorMessage(error);
  
  // Determine toast variant based on error type
  let variant: 'default' | 'destructive' = 'destructive';
  let title = 'Error';

  if (isAuthenticationError(error)) {
    title = 'Authentication Error';
  } else if (isValidationError(error)) {
    title = 'Validation Error';
    variant = 'default'; // Less severe for validation errors
  } else if (isNetworkError(error)) {
    title = 'Connection Error';
  } else if (isAPIError(error)) {
    title = 'Service Error';
  }

  toast({
    title,
    description: message,
    variant,
  });
};

// Specific handlers for common scenarios

// Auth error handler
export const handleAuthError = (error: unknown, context?: string): BaseAppError => {
  return handleError(error, {
    showToast: true,
    logError: true,
    redirectOnAuth: true,
    context: context || 'Authentication',
  });
};

// API error handler
export const handleAPIError = (error: unknown, endpoint?: string): BaseAppError => {
  return handleError(error, {
    showToast: true,
    logError: true,
    context: endpoint ? `API: ${endpoint}` : 'API',
  });
};

// Validation error handler
export const handleValidationError = (error: unknown, field?: string): BaseAppError => {
  return handleError(error, {
    showToast: true,
    logError: false, // Don't log validation errors as they're user errors
    context: field ? `Validation: ${field}` : 'Validation',
  });
};

// Silent error handler (logs but doesn't show toast)
export const handleSilentError = (error: unknown, context?: string): BaseAppError => {
  return handleError(error, {
    showToast: false,
    logError: true,
    context,
  });
};

// Network error handler with retry logic
export const handleNetworkError = (
  error: unknown,
  retryFn?: () => Promise<void>,
  maxRetries: number = 3
): BaseAppError => {
  const appError = handleError(error, {
    showToast: true,
    logError: true,
    context: 'Network',
  });

  // For now, just show a simple error toast
  // TODO: Add retry functionality with proper React component integration
  if (retryFn && isNetworkError(appError)) {
    toast({
      title: 'Connection Error',
      description: 'Network request failed. Please check your connection and try again.',
      variant: 'destructive',
    });
  }

  return appError;
};

// Retry with exponential backoff
const retryWithBackoff = async (
  fn: () => Promise<void>, 
  maxRetries: number, 
  attempt: number = 1
): Promise<void> => {
  try {
    await fn();
  } catch (error) {
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      setTimeout(() => {
        retryWithBackoff(fn, maxRetries, attempt + 1);
      }, delay);
    } else {
      handleError(error, {
        showToast: true,
        logError: true,
        context: `Retry failed after ${maxRetries} attempts`,
      });
    }
  }
};

// Error boundary error handler
export const handleErrorBoundaryError = (error: Error, errorInfo: React.ErrorInfo): void => {
  const appError = new BaseAppError(
    'COMPONENT_ERROR',
    'A component error occurred',
    { error: error.message, stack: error.stack, errorInfo }
  );

  logError(appError, 'Error Boundary');

  // Don't show toast for error boundary errors as they have their own UI
};

// Async error wrapper for promises
export const withErrorHandling = <T>(
  promise: Promise<T>,
  config?: ErrorHandlerConfig
): Promise<T> => {
  return promise.catch((error) => {
    handleError(error, config);
    throw error; // Re-throw so calling code can handle it if needed
  });
};

// Hook for handling errors in React components
export const useErrorHandler = () => {
  return {
    handleError,
    handleAuthError,
    handleAPIError,
    handleValidationError,
    handleSilentError,
    handleNetworkError,
  };
};
