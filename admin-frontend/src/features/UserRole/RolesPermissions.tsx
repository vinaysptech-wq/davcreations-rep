"use client";

import React, { useState, useEffect, useCallback } from 'react';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import { usersApi, userTypesApi } from '@/shared/utils/apiClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import RoleBasedGuard from '@/components/auth/RoleBasedGuard';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import InputField from '@/components/form/input/InputField';
import Switch from '@/components/form/switch/Switch';
import Select from '@/components/form/Select';
import MultiSelect from '@/components/form/MultiSelect';
import Label from '@/components/form/Label';

interface Module {
  admin_module_id: number;
  module_name: string;
  category: string;
  description?: string;
  is_active: boolean;
}

interface UserType {
  user_type_id: number;
  user_type_name: string;
  created_date: string;
  last_updated_date: string;
  is_active: boolean;
}

interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  user_type_name: string;
}

const RolesPermissions: React.FC = () => {
  useAuth();
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User Types Management
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [editingUserType, setEditingUserType] = useState<UserType | null>(null);
  const [userTypeForm, setUserTypeForm] = useState({
    user_type_name: '',
    is_active: true,
  });

  // User Permissions Management
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [userTypesResponse, usersResponse, modulesResponse] = await Promise.all([
        userTypesApi.getUserTypes(),
        usersApi.getUsers(),
        usersApi.getModules(),
      ]);
      setUserTypes(userTypesResponse.data as UserType[]);
      setUsers((usersResponse.data as { users: User[] }).users);
      setModules(modulesResponse.data as Module[]);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // User Types CRUD
  const handleAddUserType = () => {
    setEditingUserType(null);
    setUserTypeForm({ user_type_name: '', is_active: true });
    setShowUserTypeModal(true);
  };

  const handleEditUserType = (userType: UserType) => {
    setEditingUserType(userType);
    setUserTypeForm({
      user_type_name: userType.user_type_name,
      is_active: userType.is_active,
    });
    setShowUserTypeModal(true);
  };

  const handleDeleteUserType = async (id: number) => {
    if (confirm('Are you sure you want to delete this user type?')) {
      try {
        await userTypesApi.deleteUserType(id.toString());
        fetchData();
      } catch (err) {
        console.error('Error deleting user type:', err);
      }
    }
  };

  const handleSaveUserType = async () => {
    try {
      if (editingUserType) {
        await userTypesApi.updateUserType(editingUserType.user_type_id.toString(), userTypeForm);
      } else {
        await userTypesApi.createUserType(userTypeForm);
      }
      setShowUserTypeModal(false);
      fetchData();
    } catch (err) {
      console.error('Error saving user type:', err);
    }
  };

  // User Permissions
  const handleUserChange = async (userId: string) => {
    setSelectedUser(userId);
    if (userId) {
      try {
        const response = await usersApi.getUserModules(userId);
        const userModules = response.data as { admin_module_id: number }[];
        setSelectedModules(userModules.map(m => m.admin_module_id.toString()));
      } catch (err) {
        console.error('Error fetching user modules:', err);
        setSelectedModules([]);
      }
    } else {
      setSelectedModules([]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    try {
      await usersApi.updateUserModules(selectedUser, selectedModules);
      alert('Permissions updated successfully');
    } catch (err) {
      console.error('Error saving permissions:', err);
    }
  };

  if (loading) {
    return (
      <RoleBasedGuard allowedRoles={['Superadmin']}>
        <PageBreadCrumb pageTitle="Roles & Permissions" />
        <div className="space-y-6">
          <ComponentCard title="Roles & Permissions Management">
            <div className="p-6 text-center">
              <p>Loading...</p>
            </div>
          </ComponentCard>
        </div>
      </RoleBasedGuard>
    );
  }

  if (error) {
    return (
      <RoleBasedGuard allowedRoles={['Superadmin']}>
        <PageBreadCrumb pageTitle="Roles & Permissions" />
        <div className="space-y-6">
          <ComponentCard title="Roles & Permissions Management">
            <div className="p-6 text-center text-red-500">
              <p>{error}</p>
            </div>
          </ComponentCard>
        </div>
      </RoleBasedGuard>
    );
  }

  return (
    <RoleBasedGuard allowedRoles={['Superadmin']}>
      <PageBreadCrumb pageTitle="Roles & Permissions" />
      <div className="space-y-6">
        {/* User Types Management */}
        <ComponentCard title="User Types Management">
          <div className="p-6">
            <div className="mb-4 flex justify-between items-center">
              <p className="text-gray-600 dark:text-gray-400">
                Manage user types and their active status.
              </p>
              <Button onClick={handleAddUserType}>Add User Type</Button>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        User Type Name
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Created Date
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Last Updated Date
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Is Active
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHeader>

                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {userTypes.map((userType) => (
                      <TableRow key={userType.user_type_id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {userType.user_type_name}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {new Date(userType.created_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {new Date(userType.last_updated_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center text-theme-sm dark:text-gray-400">
                          <Badge size="sm" color={userType.is_active ? "success" : "error"}>
                            {userType.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm dark:text-gray-400">
                          <Button size="sm" onClick={() => handleEditUserType(userType)}>Edit</Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteUserType(userType.user_type_id)} className="ml-2">Delete</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* User Permissions Management */}
        <ComponentCard title="User Permissions Management">
          <div className="p-6">
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Assign modules to users. Select a user and choose the modules they should have access to.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select User
                  </label>
                  <Select
                    options={users.map(user => ({
                      value: user.user_id.toString(),
                      label: `${user.first_name} ${user.last_name} (${user.email})`
                    }))}
                    value={selectedUser}
                    onChange={handleUserChange}
                    placeholder="Choose a user"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Modules
                  </label>
                  <MultiSelect
                    label="Select Modules"
                    options={modules.filter(m => m.is_active).map(module => ({
                      value: module.admin_module_id.toString(),
                      text: module.module_name,
                      selected: selectedModules.includes(module.admin_module_id.toString())
                    }))}
                    defaultSelected={selectedModules}
                    onChange={setSelectedModules}
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={handleSavePermissions} disabled={!selectedUser}>
                  Save Permissions
                </Button>
              </div>
            </div>
          </div>
        </ComponentCard>
      </div>

      {/* User Type Modal */}
      <Modal isOpen={showUserTypeModal} onClose={() => setShowUserTypeModal(false)}>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingUserType ? 'Edit User Type' : 'Add User Type'}
          </h2>
          <div className="space-y-4">
            <div>
              <Label>User Type Name</Label>
              <InputField
                value={userTypeForm.user_type_name}
                onChange={(e) => setUserTypeForm({ ...userTypeForm, user_type_name: e.target.value })}
              />
            </div>
            <Switch
              label="Is Active"
              checked={userTypeForm.is_active}
              onChange={(checked) => setUserTypeForm({ ...userTypeForm, is_active: checked })}
            />
          </div>
          <div className="mt-6 flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowUserTypeModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUserType}>
              {editingUserType ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </RoleBasedGuard>
  );
};

export default RolesPermissions;