"use client";

import React, { useState, useEffect } from 'react';
import Label from '../../../components/form/Label';
import Select from '../../../components/form/Select';
import Switch from '../../../components/form/switch/Switch';
import { useProfilePreferences } from '../hooks/useProfilePreferences';
import type { UserPreferences } from '../types/profile';

export default function ProfilePreferences() {
  const { preferences, updating, updatePreferences } = useProfilePreferences();
  const [localPreferences, setLocalPreferences] = useState<UserPreferences>({
    theme: 'light',
    language: 'en',
    email_notifications: true,
    push_notifications: false,
  });

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const handlePreferenceChange = async (key: keyof UserPreferences, value: string | boolean) => {
    const updatedPreferences = { ...localPreferences, [key]: value };
    setLocalPreferences(updatedPreferences);

    try {
      await updatePreferences({ [key]: value });
    } catch (error) {
      // Revert on error
      setLocalPreferences(localPreferences);
      console.error('Error updating preference:', error);
    }
  };

  if (!preferences) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Super Admin Preferences
      </h2>

      <div className="space-y-6">
        <div>
          <Label>Theme</Label>
          <Select
            value={localPreferences.theme}
            onChange={(value) => handlePreferenceChange('theme', value)}
            disabled={updating}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Choose your preferred theme for the application.
          </p>
        </div>

        <div>
          <Label>Language</Label>
          <Select
            value={localPreferences.language}
            onChange={(value) => handlePreferenceChange('language', value)}
            disabled={updating}
            options={[
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Spanish' },
              { value: 'fr', label: 'French' },
            ]}
          />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Select your preferred language for the interface.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Email Notifications</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Receive notifications via email for important system events.
            </p>
          </div>
          <Switch
            checked={localPreferences.email_notifications}
            onChange={(checked) => handlePreferenceChange('email_notifications', checked)}
            disabled={updating}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Push Notifications</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Receive push notifications in your browser for real-time updates.
            </p>
          </div>
          <Switch
            checked={localPreferences.push_notifications}
            onChange={(checked) => handlePreferenceChange('push_notifications', checked)}
            disabled={updating}
          />
        </div>
      </div>
    </div>
  );
}