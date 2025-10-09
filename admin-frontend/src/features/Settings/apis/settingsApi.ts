import { settingsApi } from '../../../shared/utils/apiClient';

export const getSettings = () => settingsApi.getSettings();

export const createSetting = (data: { setting_key: string; setting_value: string }) =>
  settingsApi.createSetting(data);

export const updateSetting = (key: string, value: string) =>
  settingsApi.updateSetting(key, value);

export const deleteSetting = (key: string) => settingsApi.deleteSetting(key);