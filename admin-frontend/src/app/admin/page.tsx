"use client";
import React, { useEffect, useState } from 'react';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import { apiClient } from '../../shared/utils/apiClient';
import { useAuth } from '../../features/auth/hooks/useAuth';

interface AdminStats {
  totalUsers: number;
  totalModules: number;
  activeUsers: number;
  totalLogs: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user, token } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      console.log('AdminPage: Auth status - isAuthenticated:', isAuthenticated, 'user:', user, 'token present:', !!token);
      if (token) {
        console.log('AdminPage: Token value (first 20 chars):', token.substring(0, 20) + '...');
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('AdminPage: Token payload:', { exp: payload.exp, iat: payload.iat, currentTime: Math.floor(Date.now() / 1000) });
          if (payload.exp < Math.floor(Date.now() / 1000)) {
            console.log('AdminPage: Token is expired');
          } else {
            console.log('AdminPage: Token is valid, expires in:', payload.exp - Math.floor(Date.now() / 1000), 'seconds');
          }
        } catch (e) {
          console.log('AdminPage: Failed to decode token:', e);
        }
      }
      if (!isAuthenticated) {
        console.log('AdminPage: Skipping API calls - user not authenticated');
        setLoading(false);
        return;
      }

      // Check if user has admin role
      const adminRoles = ['Superadmin', 'Admin'];
      if (!user || !user.user_type_name || !adminRoles.includes(user.user_type_name)) {
        console.log('AdminPage: Skipping API calls - user does not have admin role', user?.user_type_name);
        setError('Access denied: Admin privileges required');
        setLoading(false);
        return;
      }

      try {
        console.log('AdminPage: Fetching admin stats');
        console.log('AdminPage: User authenticated:', isAuthenticated);

        // Fetch each API individually to identify which one fails
        console.log('AdminPage: Fetching users...');
        const usersRes = await apiClient.get('/api/users?page=1&limit=1');
        console.log('AdminPage: Users response:', usersRes);

        console.log('AdminPage: Fetching modules...');
        const modulesRes = await apiClient.get('/api/admin-modules');
        console.log('AdminPage: Modules response:', modulesRes);

        console.log('AdminPage: Fetching logs...');
        const logsRes = await apiClient.get('/api/logging/logs?page=1&limit=1');
        console.log('AdminPage: Logs response:', logsRes);

        const totalUsers = (usersRes.data as { total: number }).total || 0;
        const totalModules = (modulesRes.data as unknown[]).length || 0;
        const totalLogs = (logsRes.data as { structured: { total: number } }).structured?.total || 0;

        console.log('AdminPage: Parsed data:', { totalUsers, totalModules, totalLogs });

        // For active users, we might need a separate endpoint, for now assume all are active
        const activeUsers = totalUsers;

        setStats({
          totalUsers,
          totalModules,
          activeUsers,
          totalLogs,
        });
        console.log('AdminPage: Stats loaded successfully', { totalUsers, totalModules, totalLogs });
      } catch (err) {
        console.error('AdminPage: Failed to fetch admin stats:', err);
        console.error('AdminPage: Error type:', typeof err);
        console.error('AdminPage: Error keys:', err ? Object.keys(err) : 'no err');
        if (err && typeof err === 'object') {
          console.error('AdminPage: Error details:', JSON.stringify(err, null, 2));
        }
        setError('Failed to load admin statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated, token, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Admin Dashboard" />

      <div className={`grid grid-cols-1 gap-6 ${user?.user_type_name === 'Superadmin' ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2'}`}>
        <ComponentCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalUsers || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.activeUsers || 0}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </ComponentCard>

        {user?.user_type_name === 'Superadmin' && (
          <>
            <ComponentCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Modules</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalModules || 0}</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </ComponentCard>

            <ComponentCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Activity Logs</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalLogs || 0}</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </ComponentCard>
          </>
        )}
      </div>

      {user?.user_type_name === 'Superadmin' && (
        <ComponentCard>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Summary</h3>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {(user?.first_name as string)?.[0]}{(user?.last_name as string)?.[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{user?.user_type_name}</p>
            </div>
            <a
              href="/admin/profile"
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Edit Profile
            </a>
          </div>
        </ComponentCard>
      )}

      <ComponentCard>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className={`grid grid-cols-1 gap-4 ${user?.user_type_name === 'Superadmin' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          <a
            href="/admin/UserRole/AdminUsers"
            className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <h4 className="font-medium text-blue-900 dark:text-blue-100">Manage Users</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">Add, edit, and manage user accounts</p>
          </a>
          {user?.user_type_name === 'Superadmin' && (
            <>
              <a
                href="/admin/UserRole/ManageModules"
                className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                <h4 className="font-medium text-purple-900 dark:text-purple-100">Manage Modules</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">Configure admin modules and permissions</p>
              </a>
              <a
                href="/admin/profile"
                className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <h4 className="font-medium text-green-900 dark:text-green-100">Manage Profile</h4>
                <p className="text-sm text-green-700 dark:text-green-300">Update your profile information and settings</p>
              </a>
            </>
          )}
          <a
            href="/admin/UserRole/ActivityLogs"
            className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
          >
            <h4 className="font-medium text-orange-900 dark:text-orange-100">View Logs</h4>
            <p className="text-sm text-orange-700 dark:text-orange-300">Monitor system activity and audit logs</p>
          </a>
        </div>
      </ComponentCard>
    </div>
  );
}