'use client';

import React, { useState, useEffect } from 'react';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import { usersApi } from '@/shared/utils/apiClient';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';

interface UserType {
  id: string;
  user_type_name: string;
  description?: string;
  created_at: string;
}

export default function UserRolePage() {
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserTypes();
  }, []);

  const fetchUserTypes = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getUserTypes();
      setUserTypes(response.data as UserType[]);
    } catch (err) {
      setError('Failed to fetch user types');
      console.error('Error fetching user types:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageBreadCrumb pageTitle="User & Role Management" />
        <div className="space-y-6">
          <ComponentCard title="User & Role Management">
            <div className="p-6 text-center">
              <p>Loading user types...</p>
            </div>
          </ComponentCard>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageBreadCrumb pageTitle="User & Role Management" />
        <div className="space-y-6">
          <ComponentCard title="User & Role Management">
            <div className="p-6 text-center text-red-500">
              <p>{error}</p>
            </div>
          </ComponentCard>
        </div>
      </>
    );
  }

  return (
    <>
      <PageBreadCrumb pageTitle="User & Role Management" />
      <div className="space-y-6">
        <ComponentCard title="User & Role Management">
          <div className="p-6">
            <div className="mb-4 flex justify-between items-center">
              <p className="text-gray-600 dark:text-gray-400">
                Manage users and their roles in the system. This section allows you to assign roles,
                manage permissions, and control access levels for team members and administrators.
              </p>
              <Button>Add New Role</Button>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <div className="min-w-[600px]">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Role Name
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Description
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Status
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {userTypes.map((userType) => (
                        <TableRow key={userType.id}>
                          <TableCell className="px-5 py-4 sm:px-6 text-start">
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {userType.user_type_name}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {userType.description || 'No description'}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            <Badge size="sm" color="success">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">Edit</Button>
                              <Button size="sm" variant="outline">Permissions</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}