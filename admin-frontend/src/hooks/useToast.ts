import { useCallback } from 'react';
import toast from 'react-hot-toast';

export interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

export const useToast = () => {
  const success = useCallback((message: string, options?: ToastOptions) => {
    toast.success(message, options);
  }, []);

  const error = useCallback((message: string, options?: ToastOptions) => {
    toast.error(message, options);
  }, []);

  const info = useCallback((message: string, options?: ToastOptions) => {
    toast(message, {
      ...options,
      icon: 'ℹ️',
    });
  }, []);

  const warning = useCallback((message: string, options?: ToastOptions) => {
    toast(message, {
      ...options,
      icon: '⚠️',
    });
  }, []);

  const loading = useCallback((message: string, options?: ToastOptions) => {
    return toast.loading(message, options);
  }, []);

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }, []);

  return {
    success,
    error,
    info,
    warning,
    loading,
    dismiss,
  };
};