import { useState, useCallback } from 'react';
import { auditApi } from '@/shared/utils/apiClient';
import { PermissionAudit } from '../types';
import { useToast } from '@/hooks/useToast';

export const useAuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState<PermissionAudit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { error: toastError } = useToast();

  const fetchAuditLogsForPermission = useCallback(async (rolePermissionsId: string, limit = 50) => {
    try {
      setLoading(true);
      setError(null);
      const response = await auditApi.getAuditLogsForPermission(rolePermissionsId, limit);
      setAuditLogs(response.data as PermissionAudit[]);
    } catch (err) {
      setError('Failed to fetch audit logs');
      toastError('Failed to fetch audit logs');
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  const fetchAuditLogsForUser = useCallback(async (userId: string, limit = 100) => {
    try {
      setLoading(true);
      setError(null);
      const response = await auditApi.getAuditLogsForUser(userId, limit);
      setAuditLogs(response.data as PermissionAudit[]);
    } catch (err) {
      setError('Failed to fetch user audit logs');
      toastError('Failed to fetch user audit logs');
      console.error('Error fetching user audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  const fetchAuditLogsByDateRange = useCallback(async (startDate: string, endDate: string, limit = 500) => {
    try {
      setLoading(true);
      setError(null);
      const response = await auditApi.getAuditLogsByDateRange(startDate, endDate, limit);
      setAuditLogs(response.data as PermissionAudit[]);
    } catch (err) {
      setError('Failed to fetch audit logs by date range');
      toastError('Failed to fetch audit logs by date range');
      console.error('Error fetching audit logs by date range:', err);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  const getAuditSummary = useCallback(async (startDate: string, endDate: string) => {
    try {
      const response = await auditApi.getAuditSummary(startDate, endDate);
      return response.data;
    } catch (err) {
      toastError('Failed to fetch audit summary');
      console.error('Error fetching audit summary:', err);
      throw err;
    }
  }, [toastError]);

  return {
    auditLogs,
    loading,
    error,
    fetchAuditLogsForPermission,
    fetchAuditLogsForUser,
    fetchAuditLogsByDateRange,
    getAuditSummary,
  };
};