import { useState, useEffect, useCallback } from 'react';
import { userTypesApi } from '@/shared/utils/apiClient';
import { Role } from '../types';
import { useToast } from '@/hooks/useToast';

export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userTypesApi.getUserTypes();
      setRoles(response.data as Role[]);
    } catch (err) {
      setError('Failed to fetch roles');
      toastError('Failed to fetch roles');
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  const createRole = useCallback(async (roleData: { user_type_name: string; is_active?: boolean }) => {
    try {
      const response = await userTypesApi.createUserType(roleData);
      setRoles(prev => [...prev, response.data as Role]);
      success('Role created successfully');
      return response.data;
    } catch (err) {
      toastError('Failed to create role');
      console.error('Error creating role:', err);
      throw err;
    }
  }, [success, toastError]);

  const updateRole = useCallback(async (id: string, roleData: Partial<Role>) => {
    try {
      const response = await userTypesApi.updateUserType(id, roleData);
      setRoles(prev => prev.map(role =>
        role.user_type_id.toString() === id ? response.data as Role : role
      ));
      success('Role updated successfully');
      return response.data;
    } catch (err) {
      toastError('Failed to update role');
      console.error('Error updating role:', err);
      throw err;
    }
  }, [success, toastError]);

  const deleteRole = useCallback(async (id: string) => {
    try {
      await userTypesApi.deleteUserType(id);
      setRoles(prev => prev.filter(role => role.user_type_id.toString() !== id));
      success('Role deleted successfully');
    } catch (err) {
      toastError('Failed to delete role');
      console.error('Error deleting role:', err);
      throw err;
    }
  }, [success, toastError]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    loading,
    error,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
  };
};