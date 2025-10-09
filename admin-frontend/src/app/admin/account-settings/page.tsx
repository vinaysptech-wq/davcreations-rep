"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../hooks/useToast';
import { preferencesApi } from '../../../shared/utils/apiClient';
import Button from '../../../components/ui/button/Button';
import Label from '../../../components/form/Label';
import Select from '../../../components/form/Select';
import Checkbox from '../../../components/form/input/Checkbox';

interface UserPreferences {
  preference_id: number;
  user_id: number;
  theme: string;
  language: string;
  email_notifications: boolean;
  push_notifications: boolean;
  created_date: string;
  last_updated_date: string;
}

export default function AccountSettingsPage() {
  const { success, error, loading: showLoading, dismiss } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const response = await preferencesApi.getPreferences();
      setPreferences(response.data as UserPreferences);
    } catch (err) {
      error('Failed to load preferences');
      console.error('Error fetching preferences:', err);
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handlePreferencesUpdate = async (updatedData: Partial<UserPreferences>) => {
    try {
      setUpdating(true);
      const loadingToast = showLoading('Updating preferences...');
      await preferencesApi.updatePreferences(updatedData);
      dismiss(loadingToast);
      success('Preferences updated successfully');
      await fetchPreferences(); // Refresh preferences data
    } catch (err) {
      dismiss();
      error('Failed to update preferences');
      console.error('Error updating preferences:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferences) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const updatedData: Partial<UserPreferences> = {
      theme: formData.get('theme') as string,
      language: formData.get('language') as string,
      email_notifications: formData.get('email_notifications') === 'on',
      push_notifications: formData.get('push_notifications') === 'on',
    };

    handlePreferencesUpdate(updatedData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load preferences</p>
      </div>
    );
  }

  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Account Settings
        </h1>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Theme Selection */}
            <div>
              <Label>Theme</Label>
              <Select
                name="theme"
                options={themeOptions}
                value={preferences.theme}
                onChange={(value) => setPreferences(prev => prev ? { ...prev, theme: value } : null)}
                placeholder="Select theme"
              />
            </div>

            {/* Language Selection */}
            <div>
              <Label>Language</Label>
              <Select
                name="language"
                options={languageOptions}
                value={preferences.language}
                onChange={(value) => setPreferences(prev => prev ? { ...prev, language: value } : null)}
                placeholder="Select language"
              />
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notifications</h3>

            <div className="space-y-3">
              <Checkbox
                id="email_notifications"
                name="email_notifications"
                label="Email Notifications"
                checked={preferences.email_notifications}
                onChange={(checked) => setPreferences(prev => prev ? { ...prev, email_notifications: checked } : null)}
              />

              <Checkbox
                id="push_notifications"
                name="push_notifications"
                label="Push Notifications"
                checked={preferences.push_notifications}
                onChange={(checked) => setPreferences(prev => prev ? { ...prev, push_notifications: checked } : null)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updating}
              className="px-6"
            >
              {updating ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}