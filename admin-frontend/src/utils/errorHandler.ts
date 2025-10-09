import logger from './logger';
import toast from 'react-hot-toast';

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export const handleApiError = (error: AppError, showToast: boolean = true): void => {
  // Log the error
  logger.error(error.message);

  // Show user-friendly toast if requested
  if (showToast) {
    let userMessage = 'An unexpected error occurred. Please try again.';

    // Customize message based on error type
    if (error.status === 401 || (error.status === 403 && error.message === 'Invalid or expired token')) {
      userMessage = 'Your session has expired. Please log in again.';
    } else if (error.status === 403) {
      userMessage = 'You do not have permission to perform this action.';
    } else if (error.status === 404) {
      userMessage = 'The requested resource was not found.';
    } else if (error.status === 429) {
      userMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (error.status === 500) {
      userMessage = 'Server error. Please try again later.';
    } else if (error.message) {
      // Use the error message if it's user-friendly
      userMessage = error.message;
    }

    toast.error(userMessage, {
      duration: error.status === 500 ? 6000 : 4000,
    });
  }
};

export const handleSuccess = (message: string, showToast: boolean = true): void => {
  logger.info(`Success: ${message}`);
  if (showToast) {
    toast.success(message);
  }
};

export const handleWarning = (message: string, showToast: boolean = true): void => {
  logger.warn(`Warning: ${message}`);
  if (showToast) {
    toast(message, {
      icon: '⚠️',
      duration: 4000,
    });
  }
};