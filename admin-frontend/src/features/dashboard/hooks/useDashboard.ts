import { useState, useEffect } from 'react';
import { fetchUserModules } from '../api/userModulesApi';
import { useAuth } from '../../auth/hooks/useAuth';

interface Module {
  id: string;
  name: string;
  category: string;
  url_slug?: string;
  is_active: boolean;
}

export function useDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [userModules, setUserModules] = useState<Module[]>([]);
  const { user, token } = useAuth();

  useEffect(() => {
    console.log('useDashboard useEffect:', { user, hasToken: !!token });
    if (user?.user_id && token) {
      loadUserModules(user.user_id);
    } else {
      console.warn('User not authenticated or token missing, skipping loadUserModules');
    }
  }, [user, token]);

  const loadUserModules = async (userId: number) => {
    try {
      const modules = await fetchUserModules(userId);
      setUserModules(modules);
    } catch (error) {
      console.error('useDashboard: Failed to load user modules', error);
    }
  };

  return {
    sidebarOpen,
    setSidebarOpen,
    isUserManagementOpen,
    setIsUserManagementOpen,
    userModules,
  };
}