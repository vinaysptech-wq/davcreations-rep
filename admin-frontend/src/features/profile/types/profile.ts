export interface Profile {
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

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'en' | 'es' | 'fr';
  email_notifications: boolean;
  push_notifications: boolean;
}

export interface PasswordChangeData {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export type ProfileUpdateData = Partial<Omit<Profile, 'user_id'>>;

export type PreferencesUpdateData = Partial<UserPreferences>;