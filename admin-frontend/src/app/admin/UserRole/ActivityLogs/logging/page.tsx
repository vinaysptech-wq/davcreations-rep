'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { loggingApi, apiClient, ApiResponse } from '@/shared/utils/apiClient';
import Button from '@/components/ui/button/Button';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Badge from '@/components/ui/badge/Badge';
import InputField from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import Label from '@/components/form/Label';
import RoleBasedGuard from '@/components/auth/RoleBasedGuard';

interface LogEntry {
  log_id: number;
  level: string;
  message: string;
  timestamp: string;
  user_id?: number;
  action?: string;
  details?: string;
  user?: {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface LogParams {
  page: number;
  limit: number;
  level?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
}

interface LogsResponse {
  structured: {
    logs: LogEntry[];
    total: number;
    page: number;
  };
}

export default function LoggingPage() {
  console.log('LoggingPage: Component mounted');
  const router = useRouter();
  const [logLevel, setLogLevel] = useState<string>('info');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    level: string;
    userId: number | undefined;
    startDate: string;
    endDate: string;
  }>({
    level: '',
    userId: undefined,
    startDate: '',
    endDate: '',
  });

  const fetchLogLevel = useCallback(async () => {
    console.log('LoggingPage: fetching log level');
    try {
      const data = await apiClient.get('/api/logging/level');
      console.log('LoggingPage: log level fetched', data);
      setLogLevel(data.data as string);
    } catch (error) {
      console.error('Error fetching log level:', error);
      router.push('/login');
    }
  }, [router]);

  const fetchLogs = useCallback(async (currentPage = page) => {
    console.log('LoggingPage: fetching logs');
    try {
      const params: LogParams = { page: currentPage, limit };
      if (filters.level) params.level = filters.level;
      if (filters.userId !== undefined) params.userId = filters.userId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await loggingApi.getLogs(params) as ApiResponse<LogsResponse>;
      console.log('LoggingPage: logs fetched', response);
      const structured = response.data.structured;
      setLogs(structured.logs);
      setTotal(structured.total);
      setPage(structured.page);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => {
    console.log('LoggingPage: useEffect triggered');
    const token = localStorage.getItem('token');
    console.log('LoggingPage: token present:', !!token);
    if (!token) {
      router.push('/login');
      return;
    }

    fetchLogLevel();
    fetchLogs();
  }, [router, fetchLogLevel, fetchLogs]);

  const handleLogLevelChange = async (newLevel: string) => {
    try {
      await apiClient.put('/api/logging/level', { level: newLevel });
      setLogLevel(newLevel);
      alert('Log level updated successfully');
    } catch (error) {
      console.error('Error updating log level:', error);
      alert('Error updating log level');
    }
  };

  const handleRefreshLogs = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchLogs(1);
      setPage(1);
    }
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchLogs(newPage);
  };

  if (loading) {
    return (
      <RoleBasedGuard allowedRoles={['Superadmin']}>
        <div className="min-h-screen flex items-center justify-center">Loading...</div>
      </RoleBasedGuard>
    );
  }

  return (
    <RoleBasedGuard allowedRoles={['Superadmin']}>
      <PageBreadCrumb pageTitle="Activity Logs" />
      <div className="space-y-6">
        {/* Log Level Management */}
        <ComponentCard title="Log Level Management">
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <Label htmlFor="logLevel">Current Level:</Label>
              <Select
                options={[
                  { value: 'error', label: 'Error' },
                  { value: 'warn', label: 'Warn' },
                  { value: 'info', label: 'Info' },
                  { value: 'debug', label: 'Debug' },
                ]}
                value={logLevel}
                onChange={handleLogLevelChange}
              />
            </div>
          </div>
        </ComponentCard>

        {/* Activity Logs */}
        <ComponentCard title="Activity Logs">
          <div className="p-6">
            {/* Filters */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Level</Label>
                <Select
                  options={[
                    { value: '', label: 'All' },
                    { value: 'error', label: 'Error' },
                    { value: 'warn', label: 'Warn' },
                    { value: 'info', label: 'Info' },
                    { value: 'debug', label: 'Debug' },
                  ]}
                  value={filters.level}
                  onChange={(value) => handleFilterChange({ ...filters, level: value })}
                  placeholder="Filter by level"
                />
              </div>
              <div>
                <Label>Start Date</Label>
                <InputField
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <InputField
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange({ ...filters, endDate: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleRefreshLogs}>Apply Filters</Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader>Timestamp</TableCell>
                      <TableCell isHeader>Level</TableCell>
                      <TableCell isHeader>User</TableCell>
                      <TableCell isHeader>Action</TableCell>
                      <TableCell isHeader>Message</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {logs.map((log) => (
                      <TableRow key={log.log_id}>
                        <TableCell className="px-5 py-4 text-start">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <Badge
                            size="sm"
                            color={
                              log.level === 'error' ? 'error' :
                              log.level === 'warn' ? 'warning' :
                              log.level === 'info' ? 'info' : 'light'
                            }
                          >
                            {log.level.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          {log.user ? `${log.user.first_name} ${log.user.last_name} (${log.user.email})` : 'System'}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          {log.action || '-'}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          {log.message}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination */}
            {total > limit && (
              <div className="mt-4 flex justify-between items-center">
                <div>
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} entries
                </div>
                <div className="flex space-x-2">
                  <Button
                    disabled={page === 1}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    disabled={page * limit >= total}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ComponentCard>
      </div>
    </RoleBasedGuard>
  );
}