import type { ProfileUpdateData, PasswordChangeData } from '../types/profile';

export interface ValidationError {
  field: string;
  message: string;
}

export const validateProfileUpdate = (data: ProfileUpdateData): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (data.first_name && data.first_name.trim().length < 2) {
    errors.push({
      field: 'first_name',
      message: 'First name must be at least 2 characters long',
    });
  }

  if (data.last_name && data.last_name.trim().length < 2) {
    errors.push({
      field: 'last_name',
      message: 'Last name must be at least 2 characters long',
    });
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.push({
      field: 'email',
      message: 'Please enter a valid email address',
    });
  }

  if (data.phone && !isValidPhone(data.phone)) {
    errors.push({
      field: 'phone',
      message: 'Please enter a valid phone number',
    });
  }

  return errors;
};

export const validatePasswordChange = (data: PasswordChangeData): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.old_password || data.old_password.trim().length === 0) {
    errors.push({
      field: 'old_password',
      message: 'Current password is required',
    });
  }

  if (!data.new_password || data.new_password.length < 6) {
    errors.push({
      field: 'new_password',
      message: 'New password must be at least 6 characters long',
    });
  }

  if (data.new_password !== data.confirm_password) {
    errors.push({
      field: 'confirm_password',
      message: 'Passwords do not match',
    });
  }

  return errors;
};

export const validateImageFile = (file: File): ValidationError[] => {
  const errors: ValidationError[] = [];
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

  if (file.size > maxSize) {
    errors.push({
      field: 'image',
      message: 'Image size must be less than 5MB',
    });
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push({
      field: 'image',
      message: 'Only JPEG, PNG, and GIF images are allowed',
    });
  }

  return errors;
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone: string): boolean => {
  // Basic phone validation - allows digits, spaces, hyphens, parentheses, and plus
  const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{8,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};