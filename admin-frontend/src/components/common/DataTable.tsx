"use client";
import React from 'react';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import Button from '@/components/ui/button/Button';
import Checkbox from '@/components/form/input/Checkbox';
import Pagination from '@/components/tables/Pagination';

export interface ColumnDefinition<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
}

export interface ActionConfig<T> {
  key: string;
  label: string;
  onClick: (item: T) => void;
  variant?: 'primary' | 'outline';
  disabled?: (item: T) => boolean;
  loading?: (item: T) => boolean;
}

export interface BulkAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
}

export interface BulkOperationConfig<T> {
  onSelectAll: (selected: boolean) => void;
  onSelectItem: (item: T, selected: boolean) => void;
  isSelected: (item: T) => boolean;
  selectedCount: number;
  bulkActions: BulkAction[];
}

export interface PaginationConfig {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Props interface for the DataTable component
 * @template T - The type of data items displayed in the table
 */
export interface DataTableProps<T> {
  /** Array of data items to display in the table */
  data: T[];
  /** Column definitions specifying how to render each data field */
  columns: ColumnDefinition<T>[];
  /** Whether the table is in a loading state */
  loading?: boolean;
  /** Error message to display if data loading failed */
  error?: string | null;
  /** Action buttons configuration for each table row */
  actions?: ActionConfig<T>[];
  /** Bulk operations configuration for multi-select functionality */
  bulkOperations?: BulkOperationConfig<T>;
  /** Pagination configuration for handling page navigation */
  pagination?: PaginationConfig;
  /** Message to display when no data is available */
  emptyMessage?: string;
  /** Additional CSS classes for styling the table container */
  className?: string;
}

/**
 * A flexible and reusable data table component with support for:
 * - Custom column rendering
 * - Row actions (edit, delete, etc.)
 * - Bulk operations with multi-select
 * - Pagination
 * - Loading and error states
 * - Responsive design
 *
 * @template T - The type of data items in the table
 * @param props - Component props
 * @returns JSX element representing the data table
 *
 * @example
 * ```tsx
 * const columns: ColumnDefinition<User>[] = [
 *   { key: 'name', header: 'Name', render: (user) => user.name },
 *   { key: 'email', header: 'Email', render: (user) => user.email }
 * ];
 *
 * const actions: ActionConfig<User>[] = [
 *   { key: 'edit', label: 'Edit', onClick: (user) => editUser(user) }
 * ];
 *
 * <DataTable
 *   data={users}
 *   columns={columns}
 *   actions={actions}
 *   loading={isLoading}
 *   emptyMessage="No users found"
 * />
 * ```
 */
function DataTable<T>({
  data,
  columns,
  loading = false,
  error = null,
  actions = [],
  bulkOperations,
  pagination,
  emptyMessage = "No data available",
  className = "",
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="p-6 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const hasBulkOperations = !!bulkOperations;
  const hasActions = actions.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Bulk Actions Bar */}
      {hasBulkOperations && bulkOperations.selectedCount > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {bulkOperations.selectedCount} item(s) selected
          </span>
          <div className="flex gap-2">
            {bulkOperations.bulkActions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant={action.variant || 'outline'}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  {/* Bulk Select Column */}
                  {hasBulkOperations && (
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      <Checkbox
                        checked={bulkOperations.selectedCount === data.length && data.length > 0}
                        onChange={bulkOperations.onSelectAll}
                      />
                    </TableCell>
                  )}

                  {/* Data Columns */}
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      isHeader
                      className={`px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 ${column.className || ''}`}
                    >
                      {column.header}
                    </TableCell>
                  ))}

                  {/* Actions Column */}
                  {hasActions && (
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Actions
                    </TableCell>
                  )}
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {data.map((item, index) => (
                  <TableRow key={index}>
                    {/* Bulk Select Cell */}
                    {hasBulkOperations && (
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <Checkbox
                          checked={bulkOperations.isSelected(item)}
                          onChange={(checked) => bulkOperations.onSelectItem(item, checked)}
                        />
                      </TableCell>
                    )}

                    {/* Data Cells */}
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={`px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 ${column.className || ''}`}
                      >
                        {column.render(item)}
                      </TableCell>
                    ))}

                    {/* Actions Cell */}
                    {hasActions && (
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <div className="flex gap-2">
                          {actions.map((action) => (
                            <Button
                              key={action.key}
                              size="sm"
                              variant={action.variant || 'outline'}
                              onClick={() => action.onClick(item)}
                              disabled={action.disabled?.(item)}
                            >
                              {action.loading?.(item) ? 'Loading...' : action.label}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}
    </div>
  );
}

export default DataTable;