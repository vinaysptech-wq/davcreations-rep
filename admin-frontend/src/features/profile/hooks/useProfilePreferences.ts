import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../hooks/useToast';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { getPreferences, updatePreferences } from '../apis/profileApi';
import type { UserPreferences, PreferencesUpdateData } from '../types/profile';

export const useProfilePreferences = () => {
  const { success, error, loading: showLoading, dismiss } = useToast();
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchPreferences = useCallback(async () => {
    // Only fetch preferences for Superadmin users
    if (user?.user_type_name !== 'Superadmin') {
      return;
    }

    try {
      setLoading(true);
      const data = await getPreferences();
      setPreferences(data);
    } catch (err) {
      console.error('Error fetching preferences:', err);
      // Don't show error toast for preferences as they might not be critical
    } finally {
      setLoading(false);
    }
  }, [user?.user_type_name]);

  const updatePreferencesData = useCallback(async (data: PreferencesUpdateData) => {
    try {
      setUpdating(true);
      const loadingToast = showLoading('Updating preferences...');
      const updatedPreferences = await updatePreferences(data);
      dismiss(loadingToast);
      success('Preferences updated successfully');
      setPreferences(updatedPreferences);
      return updatedPreferences;
    } catch (err) {
      dismiss();
      error('Failed to update preferences');
      console.error('Error updating preferences:', err);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [success, error, showLoading, dismiss]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const isSuperAdmin = user?.user_type_name === 'Superadmin';

  return {
    preferences,
    loading,
    updating,
    isSuperAdmin,
    fetchPreferences,
    updatePreferences: updatePreferencesData,
  };
};