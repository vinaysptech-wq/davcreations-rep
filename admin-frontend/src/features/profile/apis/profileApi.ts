import { profileApi as sharedProfileApi, preferencesApi as sharedPreferencesApi } from '../../../shared/utils/apiClient';
import type { Profile, UserPreferences, PasswordChangeData, ProfileUpdateData, PreferencesUpdateData } from '../types/profile';

/**
 * Profile API functions for the profile feature module
 */
export const getProfile = async (): Promise<Profile> => {
  const response = await sharedProfileApi.getProfile();
  return response.data as Profile;
};

export const updateProfile = async (data: ProfileUpdateData): Promise<Profile> => {
  const response = await sharedProfileApi.updateProfile(data);
  return response.data as Profile;
};

export const updatePassword = async (data: PasswordChangeData): Promise<void> => {
  await sharedProfileApi.updatePassword(data);
};

export const uploadProfileImage = async (formData: FormData): Promise<{ image: string }> => {
  const response = await sharedProfileApi.uploadImage(formData);
  return response.data as { image: string };
};

/**
 * Preferences API functions for the profile feature module
 */
export const getPreferences = async (): Promise<UserPreferences> => {
  const response = await sharedPreferencesApi.getPreferences();
  return response.data as UserPreferences;
};

export const updatePreferences = async (data: PreferencesUpdateData): Promise<UserPreferences> => {
  const response = await sharedPreferencesApi.updatePreferences(data);
  return response.data as UserPreferences;
};