"use client";
import React from 'react';

interface FormWrapperProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  success: string | null;
  submitButtonText: string;
  cancelButtonText?: string;
  onCancel?: () => void;
  className?: string;
}

const FormWrapper: React.FC<FormWrapperProps> = ({
  children,
  onSubmit,
  loading,
  error,
  success,
  submitButtonText,
  cancelButtonText = 'Cancel',
  onCancel,
  className = '',
}) => {
  return (
    <form onSubmit={onSubmit} className={`space-y-6 ${className}`}>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600">{success}</p>
        </div>
      )}

      {children}

      <div className="flex justify-end space-x-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            {cancelButtonText}
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : submitButtonText}
        </button>
      </div>
    </form>
  );
};

export default FormWrapper;