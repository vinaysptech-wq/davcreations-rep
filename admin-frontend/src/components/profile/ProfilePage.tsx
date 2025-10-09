"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../hooks/useToast';
import { profileApi, preferencesApi } from '../../shared/utils/apiClient';
import UserInfoCard from '../user-profile/UserInfoCard';
import UserAddressCard from '../user-profile/UserAddressCard';
import Button from '../ui/button/Button';
import InputField from '../form/input/InputField';
import Label from '../form/Label';
import { Modal } from '../ui/modal';
import { useAuth } from '../../features/auth/hooks/useAuth';
import Switch from '../form/switch/Switch';
import Select from '../form/Select';

interface UserProfile {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  image?: string;
}

interface UserPreferences {
  theme: string;
  language: string;
  email_notifications: boolean;
  push_notifications: boolean;
}

export default function ProfilePage() {
  const { success, error, loading: showLoading, dismiss } = useToast();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await profileApi.getProfile();
      setProfile(response.data as UserProfile);
    } catch (err) {
      error('Failed to load profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, [error]);

  const fetchPreferences = useCallback(async () => {
    if (user?.user_type_name === 'Superadmin') {
      try {
        const response = await preferencesApi.getPreferences();
        setPreferences(response.data as UserPreferences);
      } catch (err) {
        console.error('Error fetching preferences:', err);
      }
    }
  }, [user?.user_type_name]);

  useEffect(() => {
    fetchProfile();
    fetchPreferences();
  }, [fetchProfile, fetchPreferences]);

  const handleProfileUpdate = async (updatedData: Partial<UserProfile>) => {
    try {
      const loadingToast = showLoading('Updating profile...');
      await profileApi.updateProfile(updatedData);
      dismiss(loadingToast);
      success('Profile updated successfully');
      await fetchProfile(); // Refresh profile data
    } catch (err) {
      dismiss();
      error('Failed to update profile');
      console.error('Error updating profile:', err);
    }
  };

  const handlePreferencesUpdate = async (updatedPreferences: Partial<UserPreferences>) => {
    try {
      const loadingToast = showLoading('Updating preferences...');
      await preferencesApi.updatePreferences(updatedPreferences);
      dismiss(loadingToast);
      success('Preferences updated successfully');
      await fetchPreferences(); // Refresh preferences data
    } catch (err) {
      dismiss();
      error('Failed to update preferences');
      console.error('Error updating preferences:', err);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      error('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      error('New password must be at least 6 characters long');
      return;
    }

    try {
      setUpdatingPassword(true);
      const loadingToast = showLoading('Changing password...');
      await profileApi.updatePassword(passwordData);
      dismiss(loadingToast);
      success('Password changed successfully');
      setIsPasswordModalOpen(false);
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err) {
      dismiss();
      error('Failed to change password');
      console.error('Error changing password:', err);
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Profile Management
        </h1>
        <Button
          onClick={() => setIsPasswordModalOpen(true)}
          variant="outline"
        >
          Change Password
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserInfoCard
          profile={profile}
          onUpdate={handleProfileUpdate}
        />
        <UserAddressCard
          profile={profile}
          onUpdate={handleProfileUpdate}
        />
      </div>

      {/* Super Admin Settings */}
      {user?.user_type_name === 'Superadmin' && preferences && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Super Admin Preferences
          </h2>
          <div className="space-y-6">
            <div>
              <Label>Theme</Label>
              <Select
                value={preferences.theme}
                onChange={(value) => handlePreferencesUpdate({ theme: value })}
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                ]}
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Choose your preferred theme.
              </p>
            </div>
            <div>
              <Label>Language</Label>
              <Select
                value={preferences.language}
                onChange={(value) => handlePreferencesUpdate({ language: value })}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Spanish' },
                  { value: 'fr', label: 'French' },
                ]}
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Select your language preference.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive notifications via email.
                </p>
              </div>
              <Switch
                checked={preferences.email_notifications}
                onChange={(checked) => handlePreferencesUpdate({ email_notifications: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive push notifications in your browser.
                </p>
              </div>
              <Switch
                checked={preferences.push_notifications}
                onChange={(checked) => handlePreferencesUpdate({ push_notifications: checked })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
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

          <form onSubmit={handlePasswordChange} className="flex flex-col">
            <div className="custom-scrollbar h-auto overflow-y-auto px-2 pb-3">
              <div className="space-y-5">
                <div>
                  <Label>Current Password</Label>
                  <InputField
                    type="password"
                    value={passwordData.old_password}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, old_password: e.target.value }))}
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div>
                  <Label>New Password</Label>
                  <InputField
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                    placeholder="Enter new password"
                    required
                  />
                </div>

                <div>
                  <Label>Confirm New Password</Label>
                  <InputField
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPasswordModalOpen(false)}
                disabled={updatingPassword}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                type="submit"
                disabled={updatingPassword}
              >
                {updatingPassword ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}