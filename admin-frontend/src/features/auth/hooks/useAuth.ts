import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../../../features/UserRole/apis';

// Helper function to decode JWT token
const decodeJWT = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

interface User {
  user_id: number;
  user_type_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  image?: string;
  module_permissions?: number[];
}

export function useAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      return !!(storedToken && storedUser);
    }
    return false;
  });

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser) as User;
        // Decode token to get permissions if not already in user data
        if (!userData.module_permissions) {
          const decodedToken = decodeJWT(storedToken);
          userData.module_permissions = decodedToken?.module_permissions || [];
        }
        return userData;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  });

  const [refreshToken, setRefreshToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken');
    }
    return null;
  });

  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('useAuth: Initializing from localStorage', { storedToken: !!token, storedUser: !!user, storedRefreshToken: !!refreshToken });
    // Start timer if we have a token
    if (token && refreshToken) {
      startRefreshTimer(token);
    }
  }, [token, user, refreshToken]);

  useEffect(() => {
    console.log('useAuth: isAuthenticated changed', isAuthenticated);
  }, [isAuthenticated]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
    };
  }, [refreshTimer]);

  const login = (newToken: string, userData: User, newRefreshToken?: string) => {
    console.log('useAuth: Login called', { hasToken: !!newToken, hasUser: !!userData, hasRefreshToken: !!newRefreshToken });

    // Decode token to get permissions
    const decodedToken = decodeJWT(newToken);
    const permissions = decodedToken?.module_permissions || [];

    const userWithPermissions = { ...userData, module_permissions: permissions };

    if (typeof window !== 'undefined') {
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userWithPermissions));
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
    }
    setToken(newToken);
    setUser(userWithPermissions);
    setRefreshToken(newRefreshToken || null);
    setIsAuthenticated(true);

    // Start proactive renewal timer
    if (newRefreshToken) {
      startRefreshTimer(newToken);
    }
  };

  const refreshTokenMethod = async (): Promise<boolean> => {
    if (!refreshToken) {
      console.error('useAuth: No refresh token available');
      return false;
    }

    try {
      console.log('useAuth: Attempting token refresh');
      const response = await authApi.refresh({ refreshToken }) as { data: { token: string; refreshToken?: string } };
      const { token: newToken, refreshToken: newRefreshToken } = response.data;

      // Update stored tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', newToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
      }
      setToken(newToken);
      setRefreshToken(newRefreshToken || refreshToken);

      // Restart timer with new token
      startRefreshTimer(newToken);

      console.log('useAuth: Token refresh successful');
      return true;
    } catch (error) {
      console.error('useAuth: Token refresh failed', error);
      // On refresh failure, logout
      logout();
      return false;
    }
  };

  const startRefreshTimer = (currentToken: string) => {
    // Clear existing timer
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }

    const decoded = decodeJWT(currentToken);
    if (!decoded || !decoded.exp) {
      console.error('useAuth: Invalid token for timer setup');
      return;
    }

    const expiryTime = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;
    const refreshTime = timeUntilExpiry - (5 * 60 * 1000); // 5 minutes before expiry

    if (refreshTime > 0) {
      console.log(`useAuth: Setting refresh timer for ${refreshTime / 1000} seconds from now`);
      const timer = setTimeout(() => {
        console.log('useAuth: Proactive token refresh triggered');
        refreshTokenMethod();
      }, refreshTime);
      setRefreshTimer(timer);
    } else {
      console.warn('useAuth: Token expires too soon, refreshing immediately');
      refreshTokenMethod();
    }
  };

  const logout = async () => {
    console.log('useAuth: Logout called');
    // Clear timer
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      setRefreshTimer(null);
    }
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
    }
    setToken(null);
    setUser(null);
    setRefreshToken(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  return {
    isAuthenticated,
    user,
    token,
    refreshToken,
    login,
    logout,
    refreshTokenMethod,
  };
}