import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../hooks/useToast';
import { getProfile, updateProfile, updatePassword, uploadProfileImage } from '../apis/profileApi';
import type { Profile, ProfileUpdateData, PasswordChangeData } from '../types/profile';

export const useProfile = () => {
  const { success, error, loading: showLoading, dismiss } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      setProfile(data);
    } catch (err) {
      error('Failed to load profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, [error]);

  const updateProfileData = useCallback(async (data: ProfileUpdateData) => {
    try {
      setUpdating(true);
      const loadingToast = showLoading('Updating profile...');
      const updatedProfile = await updateProfile(data);
      dismiss(loadingToast);
      success('Profile updated successfully');
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      dismiss();
      error('Failed to update profile');
      console.error('Error updating profile:', err);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [success, error, showLoading, dismiss]);

  const changePassword = useCallback(async (data: PasswordChangeData) => {
    try {
      setUpdating(true);
      const loadingToast = showLoading('Changing password...');

      if (data.new_password !== data.confirm_password) {
        dismiss(loadingToast);
        error('New passwords do not match');
        return;
      }

      if (data.new_password.length < 6) {
        dismiss(loadingToast);
        error('New password must be at least 6 characters long');
        return;
      }

      await updatePassword(data);
      dismiss(loadingToast);
      success('Password changed successfully');
    } catch (err) {
      dismiss();
      error('Failed to change password');
      console.error('Error changing password:', err);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [success, error, showLoading, dismiss]);

  const uploadImage = useCallback(async (formData: FormData) => {
    try {
      setUpdating(true);
      const result = await uploadProfileImage(formData);
      success('Image uploaded successfully');

      // Update profile with new image URL
      if (profile) {
        setProfile({ ...profile, image: result.image });
      }

      return result;
    } catch (err) {
      error('Failed to upload image');
      console.error('Error uploading image:', err);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [success, error, profile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    updating,
    fetchProfile,
    updateProfile: updateProfileData,
    changePassword,
    uploadImage,
  };
};