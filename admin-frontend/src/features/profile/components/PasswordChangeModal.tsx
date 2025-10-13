"use client";

import React, { useState } from 'react';
import Button from '../../../components/ui/button/Button';
import InputField from '../../../components/form/input/InputField';
import Label from '../../../components/form/Label';
import { Modal } from '../../../components/ui/modal';
import { useProfile } from '../hooks/useProfile';
import { validatePasswordChange } from '../utils/profileValidation';
import type { PasswordChangeData } from '../types/profile';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PasswordChangeModal({ isOpen, onClose }: PasswordChangeModalProps) {
  const { changePassword, updating } = useProfile();
  const [formData, setFormData] = useState<PasswordChangeData>({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof PasswordChangeData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    const validationErrors = validatePasswordChange(formData);
    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      validationErrors.forEach(error => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      return;
    }

    try {
      await changePassword(formData);
      handleClose();
    } catch (error) {
      console.error('Error changing password:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      old_password: '',
      new_password: '',
      confirm_password: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-[500px] m-4"
    >
      <div className="relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Change Password
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Enter your current password and choose a new one.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="custom-scrollbar h-auto overflow-y-auto px-2 pb-3">
            <div className="space-y-5">
              <div>
                <Label htmlFor="old_password">Current Password *</Label>
                <InputField
                  id="old_password"
                  type="password"
                  value={formData.old_password}
                  onChange={(e) => handleInputChange('old_password', e.target.value)}
                  placeholder="Enter current password"
                  required
                  error={!!errors.old_password}
                />
              </div>

              <div>
                <Label htmlFor="new_password">New Password *</Label>
                <InputField
                  id="new_password"
                  type="password"
                  value={formData.new_password}
                  onChange={(e) => handleInputChange('new_password', e.target.value)}
                  placeholder="Enter new password"
                  required
                  error={!!errors.new_password}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Password must be at least 6 characters long
                </p>
              </div>

              <div>
                <Label htmlFor="confirm_password">Confirm New Password *</Label>
                <InputField
                  id="confirm_password"
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                  placeholder="Confirm new password"
                  required
                  error={!!errors.confirm_password}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={handleClose}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              type="submit"
              disabled={updating}
            >
              {updating ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}