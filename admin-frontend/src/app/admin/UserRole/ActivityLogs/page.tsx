'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import { loggingApi } from '@/shared/utils/apiClient';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Badge from '@/components/ui/badge/Badge';
import Pagination from '@/components/tables/Pagination';
import Select from '@/components/form/Select';
import Input from '@/components/form/input/InputField';

interface LogEntry {
  id: number;
  timestamp: string;
  level: string;
  message: string;
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

interface LogsResponse {
  structured: {
    logs: LogEntry[];
    total: number;
    page: number;
    limit: number;
  };
  file?: string;
}

interface LogParams {
  page: number;
  limit: number;
  level?: string;
  startDate?: string;
  endDate?: string;
}

export default function ActivityLogsPage() {
  const [logsData, setLogsData] = useState<LogsResponse['structured'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(50);
  const [levelFilter, setLevelFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filtersKey, setFiltersKey] = useState(0); // Force re-render for date inputs

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: LogParams = { page: currentPage, limit };
      if (levelFilter) params.level = levelFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await loggingApi.getLogs(params);
      setLogsData((response.data as LogsResponse).structured);
    } catch (err) {
      setError('Failed to fetch activity logs');
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, levelFilter, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = () => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchLogs();
  };

  const getLogLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'success';
      default:
        return 'primary';
    }
  };

  const levelOptions = [
    { value: '', label: 'All Levels' },
    { value: 'error', label: 'Error' },
    { value: 'warn', label: 'Warning' },
    { value: 'info', label: 'Info' },
    { value: 'debug', label: 'Debug' },
  ];

  if (loading) {
    return (
      <>
        <PageBreadCrumb pageTitle="Activity Logs" />
        <div className="space-y-6">
          <ComponentCard title="Activity Logs">
            <div className="p-6 text-center">
              <p>Loading activity logs...</p>
            </div>
          </ComponentCard>
        </div>
      </>
    );
  }

  if (error && !logsData) {
    return (
      <>
        <PageBreadCrumb pageTitle="Activity Logs" />
        <div className="space-y-6">
          <ComponentCard title="Activity Logs">
            <div className="p-6 text-center text-red-500">
              <p>{error}</p>
              <button
                onClick={fetchLogs}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          </ComponentCard>
        </div>
      </>
    );
  }

  return (
    <>
      <PageBreadCrumb pageTitle="Activity Logs" />
      <div className="space-y-6">
        <ComponentCard title="Activity Logs">
          <div className="p-6">
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400">
                View and monitor system activity logs. Track user actions, system events,
                and administrative activities for auditing and security purposes.
              </p>
            </div>

            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Log Level
                </label>
                <Select
                  options={levelOptions}
                  placeholder="Select level"
                  onChange={(value) => {
                    setLevelFilter(value);
                    handleFilterChange();
                  }}
                  defaultValue={levelFilter}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <Input
                  key={`start-${filtersKey}`}
                  type="date"
                  defaultValue={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    handleFilterChange();
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <Input
                  key={`end-${filtersKey}`}
                  type="date"
                  defaultValue={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    handleFilterChange();
                  }}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setLevelFilter('');
                    setStartDate('');
                    setEndDate('');
                    setCurrentPage(1);
                    setFiltersKey(prev => prev + 1);
                    fetchLogs();
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <div className="min-w-[800px]">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Timestamp
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Level
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          User
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Action
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Message
                        </TableCell>
                      </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {logsData?.logs.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell className="px-5 py-4 sm:px-6 text-start">
                              <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                              <Badge size="sm" color={getLogLevelColor(log.level)}>
                                {log.level.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                              {log.user ? `${log.user.first_name} ${log.user.last_name} (${log.user.email})` : 'System'}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                              {log.action || '-'}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                              {log.message}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Pagination */}
            {logsData && logsData.total > logsData.limit && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  currentPage={logsData.page}
                  totalPages={Math.ceil(logsData.total / logsData.limit)}
                  onPageChange={handlePageChange}
                />
              </div>
            )}

            {logsData && logsData.logs.length === 0 && (
              <div className="mt-6 text-center text-gray-500">
                No logs found matching the current filters.
              </div>
            )}
          </div>
        </ComponentCard>
      </div>
    </>
  );
}