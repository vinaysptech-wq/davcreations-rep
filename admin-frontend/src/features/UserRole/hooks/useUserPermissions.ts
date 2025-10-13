import { useState, useEffect, useCallback } from 'react';
import { usersApi, rolePermissionsApi } from '@/shared/utils/apiClient';
import { Permission, Module, RolePermission } from '../types';
import { useToast } from '@/hooks/useToast';

interface UserPermissionData extends RolePermission {
  source: 'role' | 'user' | 'inherited';
  effective_permissions: Permission;
}

interface UserPermissionData {
  admin_module_id: number;
  permissions: Permission;
}

export const useUserPermissions = () => {
  const [userPermissions, setUserPermissions] = useState<UserPermissionData[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  const fetchModules = useCallback(async () => {
    try {
      const response = await usersApi.getModules();
      setModules(response.data as Module[]);
    } catch (err) {
      console.error('Error fetching modules:', err);
    }
  }, []);

  const fetchUserPermissions = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get user-specific permissions
      const userPermsResponse = await usersApi.getUser(userId);
      const userData = userPermsResponse.data as { user_typeid: string; userPermissions?: UserPermissionData[] };

      // Get role permissions for the user's role
      const rolePermsResponse = await rolePermissionsApi.getRolePermissions(userData.user_typeid);
      const rolePerms = rolePermsResponse.data as RolePermission[];

      // Combine permissions to show effective permissions
      const combinedPermissions = combineUserPermissions(rolePerms, userData.userPermissions || []);

      setRolePermissions(rolePerms);
      setUserPermissions(combinedPermissions);
    } catch (err) {
      setError('Failed to fetch user permissions');
      toastError('Failed to fetch user permissions');
      console.error('Error fetching user permissions:', err);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  const combineUserPermissions = (rolePerms: RolePermission[], userPerms: UserPermissionData[]): UserPermissionData[] => {
    const combined: { [key: number]: UserPermissionData } = {};

    // Add role permissions
    rolePerms.forEach(perm => {
      combined[perm.admin_module_id] = {
        ...perm,
        source: 'role',
        effective_permissions: perm.permissions,
      };
    });

    // Override/add user-specific permissions
    userPerms.forEach(perm => {
      const moduleId = perm.admin_module_id;
      if (combined[moduleId]) {
        combined[moduleId] = {
          ...combined[moduleId],
          permissions: perm.permissions,
          source: 'user',
          effective_permissions: perm.permissions,
        };
      } else {
        // New user-specific permission
        combined[moduleId] = {
          ...perm,
          source: 'user',
          effective_permissions: perm.permissions,
        };
      }
    });

    return Object.values(combined);
  };

  const assignUserPermission = useCallback(async (userId: string, moduleId: number, permissions: Permission) => {
    try {
      const response = await usersApi.bulkAssignPermissions(userId, {
        permissions: [{ admin_module_id: moduleId, permissions }]
      });
      setUserPermissions(prev => [...prev, response.data as UserPermissionData]);
      success('User permission assigned successfully');
      return response.data;
    } catch (err) {
      toastError('Failed to assign user permission');
      console.error('Error assigning user permission:', err);
      throw err;
    }
  }, [success, toastError]);

  const removeUserPermission = useCallback(async (userId: string, moduleId: string) => {
    try {
      await usersApi.bulkRemovePermissions(userId, [parseInt(moduleId)]);
      setUserPermissions(prev => prev.filter(up => up.admin_module_id.toString() !== moduleId));
      success('User permission removed successfully');
    } catch (err) {
      toastError('Failed to remove user permission');
      console.error('Error removing user permission:', err);
      throw err;
    }
  }, [success, toastError]);

  const bulkAssignUserPermissions = useCallback(async (userId: string, permissions: { admin_module_id: number; permissions: Permission }[]) => {
    try {
      const response = await usersApi.bulkAssignPermissions(userId, { permissions });
      await fetchUserPermissions(userId); // Refresh permissions
      success(`${permissions.length} permissions assigned successfully`);
      return response.data;
    } catch (err) {
      toastError('Failed to assign permissions');
      console.error('Error bulk assigning permissions:', err);
      throw err;
    }
  }, [fetchUserPermissions, success, toastError]);

  const bulkRemoveUserPermissions = useCallback(async (userId: string, moduleIds: number[]) => {
    try {
      const response = await usersApi.bulkRemovePermissions(userId, moduleIds);
      await fetchUserPermissions(userId); // Refresh permissions
      success(`${moduleIds.length} permissions removed successfully`);
      return response.data;
    } catch (err) {
      toastError('Failed to remove permissions');
      console.error('Error bulk removing permissions:', err);
      throw err;
    }
  }, [fetchUserPermissions, success, toastError]);

  const updateUserPermission = useCallback(async (userId: string, moduleId: string, permissions: Permission) => {
    try {
      await removeUserPermission(userId, moduleId);
      const moduleIdNum = parseInt(moduleId);
      return await assignUserPermission(userId, moduleIdNum, permissions);
    } catch (err) {
      toastError('Failed to update user permission');
      console.error('Error updating user permission:', err);
      throw err;
    }
  }, [removeUserPermission, assignUserPermission, toastError]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  return {
    userPermissions,
    rolePermissions,
    modules,
    loading,
    error,
    fetchUserPermissions,
    assignUserPermission,
    removeUserPermission,
    bulkAssignUserPermissions,
    bulkRemoveUserPermissions,
    updateUserPermission,
  };
};