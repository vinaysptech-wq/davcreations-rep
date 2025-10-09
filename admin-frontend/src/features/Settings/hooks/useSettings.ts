import { useState, useEffect } from 'react';
import { useModal } from '../../../hooks/useModal';
import { Setting } from '../types';
import { getSettings, createSetting, updateSetting, deleteSetting } from '../apis';

export const useSettings = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const { isOpen: isAddModalOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
  const { isOpen: isEditModalOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);

  // Form states
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSettings();
      setSettings(response.data as Setting[]);
    } catch (err) {
      setError('Failed to fetch settings');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSetting = async () => {
    if (!newKey.trim() || !newValue.trim()) {
      setError('Both key and value are required');
      return;
    }

    try {
      setError(null);
      await createSetting({ setting_key: newKey.trim(), setting_value: newValue.trim() });
      setSuccess('Setting added successfully');
      setNewKey('');
      setNewValue('');
      closeAddModal();
      fetchSettings();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to add setting');
      console.error('Error adding setting:', err);
    }
  };

  const handleEditSetting = async () => {
    if (!editingSetting || !editValue.trim()) {
      setError('Value is required');
      return;
    }

    try {
      setError(null);
      await updateSetting(editingSetting.setting_key, editValue.trim());
      setSuccess('Setting updated successfully');
      setEditValue('');
      setEditingSetting(null);
      closeEditModal();
      fetchSettings();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update setting');
      console.error('Error updating setting:', err);
    }
  };

  const handleDeleteSetting = async (key: string) => {
    if (!confirm('Are you sure you want to delete this setting?')) return;

    try {
      setError(null);
      await deleteSetting(key);
      setSuccess('Setting deleted successfully');
      fetchSettings();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete setting');
      console.error('Error deleting setting:', err);
    }
  };

  const openEditModalForSetting = (setting: Setting) => {
    setEditingSetting(setting);
    setEditValue(setting.setting_value);
    openEditModal();
  };

  return {
    settings,
    loading,
    error,
    success,
    isAddModalOpen,
    openAddModal,
    closeAddModal,
    isEditModalOpen,
    openEditModal,
    closeEditModal,
    editingSetting,
    newKey,
    setNewKey,
    newValue,
    setNewValue,
    editValue,
    setEditValue,
    handleAddSetting,
    handleEditSetting,
    handleDeleteSetting,
    openEditModalForSetting,
  };
};