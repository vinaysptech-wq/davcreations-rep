import { useState, useEffect, useCallback } from 'react';
import { rolePermissionsApi, usersApi } from '@/shared/utils/apiClient';
import { RolePermission, Permission, Module } from '../types';
import { useToast } from '@/hooks/useToast';

export const usePermissions = () => {
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

  const fetchRolePermissions = useCallback(async (roleId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await rolePermissionsApi.getRolePermissions(roleId);
      setRolePermissions(response.data as RolePermission[]);
    } catch (err) {
      setError('Failed to fetch role permissions');
      toastError('Failed to fetch role permissions');
      console.error('Error fetching role permissions:', err);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  const assignPermission = useCallback(async (roleId: string, moduleId: number, permissions: Permission) => {
    try {
      const response = await rolePermissionsApi.assignPermission(roleId, {
        admin_module_id: moduleId,
        permissions
      });
      setRolePermissions(prev => [...prev, response.data as RolePermission]);
      success('Permission assigned successfully');
      return response.data;
    } catch (err) {
      toastError('Failed to assign permission');
      console.error('Error assigning permission:', err);
      throw err;
    }
  }, [success, toastError]);

  const removePermission = useCallback(async (roleId: string, moduleId: string) => {
    try {
      await rolePermissionsApi.removePermission(roleId, moduleId);
      setRolePermissions(prev => prev.filter(rp => rp.admin_module_id.toString() !== moduleId));
      success('Permission removed successfully');
    } catch (err) {
      toastError('Failed to remove permission');
      console.error('Error removing permission:', err);
      throw err;
    }
  }, [success, toastError]);

  const bulkAssignPermissions = useCallback(async (roleId: string, moduleIds: number[]) => {
    try {
      const response = await rolePermissionsApi.bulkAssignPermissions(roleId, { moduleIds });
      // Refresh permissions after bulk operation
      await fetchRolePermissions(roleId);
      success(`${moduleIds.length} permissions assigned successfully`);
      return response.data;
    } catch (err) {
      toastError('Failed to assign permissions');
      console.error('Error bulk assigning permissions:', err);
      throw err;
    }
  }, [fetchRolePermissions, success, toastError]);

  const bulkRemovePermissions = useCallback(async (roleId: string, moduleIds: number[]) => {
    try {
      const response = await rolePermissionsApi.bulkRemovePermissions(roleId, { moduleIds });
      // Refresh permissions after bulk operation
      await fetchRolePermissions(roleId);
      success(`${moduleIds.length} permissions removed successfully`);
      return response.data;
    } catch (err) {
      toastError('Failed to remove permissions');
      console.error('Error bulk removing permissions:', err);
      throw err;
    }
  }, [fetchRolePermissions, success, toastError]);

  const updatePermission = useCallback(async (roleId: string, moduleId: string, permissions: Permission) => {
    try {
      // For update, we need to remove and re-add with new permissions
      await removePermission(roleId, moduleId);
      const moduleIdNum = parseInt(moduleId);
      return await assignPermission(roleId, moduleIdNum, permissions);
    } catch (err) {
      toastError('Failed to update permission');
      console.error('Error updating permission:', err);
      throw err;
    }
  }, [removePermission, assignPermission, toastError]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  return {
    rolePermissions,
    modules,
    loading,
    error,
    fetchRolePermissions,
    assignPermission,
    removePermission,
    bulkAssignPermissions,
    bulkRemovePermissions,
    updatePermission,
  };
};