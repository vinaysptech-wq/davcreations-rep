"use client";

import React, { useState, useEffect, useCallback } from 'react';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import { usersApi, rolePermissionsApi } from '@/shared/utils/apiClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import RoleBasedGuard from '@/components/auth/RoleBasedGuard';
import { useToast } from '@/hooks/useToast';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { useRoles, usePermissions, useAuditLogs } from './hooks';
import { Module, Role } from './types';
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
import Label from '@/components/form/Label';
import Checkbox from '@/components/form/input/Checkbox';
import { ChevronDownIcon, ChevronUpIcon, PencilIcon, TrashBinIcon, InfoIcon } from '@/icons';

interface User {
  user_id: number;
  firstName: string;
  lastName: string;
  email: string;
  user_type_name: string;
}

interface UserTypeForm {
  user_type_name: string;
  is_active: boolean;
  permissions: string[];
}

const SkeletonLoader: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}></div>
);


const RolesPermissions: React.FC = () => {
  useAuth();
  const { success, error: toastError } = useToast();

  // Use new hooks
  const { roles: userTypes, loading: rolesLoading, error: rolesError, createRole, updateRole, deleteRole } = useRoles();
  const { modules, rolePermissions, fetchRolePermissions, bulkAssignPermissions, bulkRemovePermissions } = usePermissions();
  const { auditLogs, loading: auditLoading, fetchAuditLogsForPermission } = useAuditLogs();

  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // User Types Management
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [editingUserType, setEditingUserType] = useState<Role | null>(null);
  const [userTypeForm, setUserTypeForm] = useState<UserTypeForm>({
    user_type_name: '',
    is_active: true,
    permissions: [],
  });
  const [userTypeValidationErrors, setUserTypeValidationErrors] = useState<{ user_type_name?: string }>({});

  // User Permissions Management
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [currentUserModules, setCurrentUserModules] = useState<string[]>([]);
  const [savingUserPermissions, setSavingUserPermissions] = useState(false);
  const [selectedUserRoleId, setSelectedUserRoleId] = useState<string>('');
  
  // Role Permissions Management
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<string[]>([]);
  const [currentRolePermissions, setCurrentRolePermissions] = useState<string[]>([]);
  const [rolePermissionsLoading] = useState(false);
  const [rolePermissionsError] = useState<string | null>(null);
  const [savingRolePermissions, setSavingRolePermissions] = useState(false);

  // Role Permissions Cache and Modal
  const [rolePermissionsCache, setRolePermissionsCache] = useState<Record<string, { permissions: string[], loading: boolean, error: string | null }>>({});
  const [fetchingRoles, setFetchingRoles] = useState<Set<string>>(new Set());
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRoleForModal, setSelectedRoleForModal] = useState<string>('');

  // Module Selection Tree
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Confirmation Dialog
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);

  // Bulk Operations
  const [showBulkOperationsModal, setShowBulkOperationsModal] = useState(false);
  const [selectedRolesForBulk, setSelectedRolesForBulk] = useState<string[]>([]);
  const [bulkOperationType, setBulkOperationType] = useState<'assign_permissions' | 'remove_permissions' | 'delete_roles' | null>(null);
  const [bulkModules, setBulkModules] = useState<string[]>([]);

  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      setUsersError(null);
      const usersResponse = await usersApi.getUsers();
      setUsers((usersResponse.data as { users: User[] }).users);
    } catch {
      setUsersError('Failed to fetch users. Please try again.');
      toastError('Failed to fetch users. Please try again.');
      console.error('Error fetching users');
    } finally {
      setUsersLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (selectedUserRoleId && rolePermissionsCache[selectedUserRoleId]) {
      const cached = rolePermissionsCache[selectedUserRoleId];
      if (!cached.loading && !cached.error) {
      }
    }
  }, [selectedUserRoleId, rolePermissionsCache]);

  // User Types CRUD
  const handleAddUserType = () => {
    setEditingUserType(null);
    setUserTypeForm({ user_type_name: '', is_active: true, permissions: [] });
    setUserTypeValidationErrors({});
    setShowUserTypeModal(true);
  };

  const handleEditUserType = (userType: Role) => {
    setEditingUserType(userType);
    setUserTypeForm({
      user_type_name: userType.user_type_name,
      is_active: userType.is_active,
      permissions: [], // TODO: fetch from API
    });
    setUserTypeValidationErrors({});
    setShowUserTypeModal(true);
  };

  const handleDeleteUserType = async (id: number) => {
    if (confirm('Are you sure you want to delete this user type?')) {
      try {
        await deleteRole(id.toString());
      } catch {
        // Error handling is done in the hooks
      }
    }
  };

  const handleSaveUserType = async () => {
    // Validation
    const errors: { user_type_name?: string } = {};
    const trimmedName = userTypeForm.user_type_name.trim();
    if (!trimmedName) {
      errors.user_type_name = 'Role name is required';
    } else {
      const existingNames = userTypes
        .filter(ut => editingUserType ? ut.user_type_id !== editingUserType.user_type_id : true)
        .map(ut => ut.user_type_name.toLowerCase());
      if (existingNames.includes(trimmedName.toLowerCase())) {
        errors.user_type_name = 'Role name must be unique';
      }
    }
    setUserTypeValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const formToSave = { ...userTypeForm, user_type_name: trimmedName };
      if (editingUserType) {
        await updateRole(editingUserType.user_type_id.toString(), formToSave);
      } else {
        await createRole(formToSave);
      }
      setShowUserTypeModal(false);
    } catch {
      // Error handling is done in the hooks
    }
  };

  // User Permissions
  const handleUserChange = async (userId: string) => {
    setSelectedUser(userId);
    if (userId) {
      try {
        console.log('DEBUG: Fetching user modules for userId:', userId);
        const response = await usersApi.getUserModules(userId);
        console.log('DEBUG: getUserModules response:', response);
        console.log('DEBUG: response.data:', response.data);
        const userModules = (response.data as { modules: number[] }).modules;
        console.log('DEBUG: userModules array:', userModules);
        const moduleIds = userModules.map(m => m.toString());
        console.log('DEBUG: moduleIds:', moduleIds);
        setCurrentUserModules(moduleIds);
        setSelectedModules(moduleIds);

        // Find user role
        const user = users.find(u => u.user_id.toString() === userId);
        if (user) {
          const userType = userTypes.find(ut => ut.user_type_name === user.user_type_name);
          if (userType) {
            const roleId = userType.user_type_id.toString();
            setSelectedUserRoleId(roleId);
            // Fetch role permissions if not in cache
            if (!rolePermissionsCache[roleId]) {
              fetchPermissionsForRole(roleId);
            }
          }
        }
      } catch (err) {
        toastError('Failed to fetch user modules');
        console.error('Error fetching user modules:', err);
        setCurrentUserModules([]);
        setSelectedModules([]);
      }
    } else {
      setCurrentUserModules([]);
      setSelectedModules([]);
      setSelectedUserRoleId('');
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    // Calculate differences
    const added = selectedModules.filter(id => !currentUserModules.includes(id));
    const removed = currentUserModules.filter(id => !selectedModules.includes(id));

    if (removed.length > 0) {
      setConfirmationMessage(`You are about to remove ${removed.length} permission(s) from this user. This action cannot be undone. Are you sure?`);
      setOnConfirmAction(() => async () => {
        await performSavePermissions(added, removed);
      });
      setShowConfirmationModal(true);
      return;
    }

    await performSavePermissions(added, removed);
  };

  const performSavePermissions = async (added: string[], removed: string[]) => {
    try {
      setSavingUserPermissions(true);

      // Optimistic update
      setCurrentUserModules([...selectedModules]);

      // Perform bulk operations
      const promises = [];
      if (added.length > 0) {
        promises.push(usersApi.bulkAssignPermissions(selectedUser, { permissions: added }));
      }
      if (removed.length > 0) {
        promises.push(usersApi.bulkRemovePermissions(selectedUser, removed.map(id => parseInt(id))));
      }

      await Promise.all(promises);

      success('Permissions updated successfully');
    } catch (err) {
      // Rollback on error
      setCurrentUserModules([...currentUserModules]);
      setSelectedModules([...currentUserModules]);
      toastError('Failed to save permissions');
      console.error('Error saving permissions:', err);
    } finally {
      setSavingUserPermissions(false);
    }
  };
  
  // Role Permissions
  const handleRoleChange = async (roleId: string) => {
    setSelectedRole(roleId);
    if (roleId) {
      await fetchRolePermissions(roleId);
      setCurrentRolePermissions(rolePermissions.map(rp => rp.admin_module_id.toString()));
      setSelectedRolePermissions(rolePermissions.map(rp => rp.admin_module_id.toString()));
    } else {
      setCurrentRolePermissions([]);
      setSelectedRolePermissions([]);
    }
  };
  
  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return;

    // Calculate differences
    const added = selectedRolePermissions.filter(id => !currentRolePermissions.includes(id));
    const removed = currentRolePermissions.filter(id => !selectedRolePermissions.includes(id));

    if (removed.length > 0) {
      setConfirmationMessage(`You are about to remove ${removed.length} permission(s) from this role. This may affect users assigned to this role. Are you sure?`);
      setOnConfirmAction(() => async () => {
        await performSaveRolePermissions(added, removed);
      });
      setShowConfirmationModal(true);
      return;
    }

    await performSaveRolePermissions(added, removed);
  };

  const performSaveRolePermissions = async (added: string[], removed: string[]) => {
    try {
      setSavingRolePermissions(true);

      // Optimistic update
      setCurrentRolePermissions([...selectedRolePermissions]);

      // Perform bulk operations
      const promises = [];
      if (added.length > 0) {
        const moduleIds = added.map(id => parseInt(id));
        promises.push(bulkAssignPermissions(selectedRole, moduleIds));
      }
      if (removed.length > 0) {
        const moduleIds = removed.map(id => parseInt(id));
        promises.push(bulkRemovePermissions(selectedRole, moduleIds));
      }

      await Promise.all(promises);

      // Refresh permissions after bulk operations
      await fetchRolePermissions(selectedRole);
    } catch {
      // Rollback on error
      setCurrentRolePermissions([...currentRolePermissions]);
      setSelectedRolePermissions([...currentRolePermissions]);
    } finally {
      setSavingRolePermissions(false);
    }
  };

  // Fetch permissions for a role
  const fetchPermissionsForRole = useCallback(async (roleId: string) => {
    if (rolePermissionsCache[roleId] || fetchingRoles.has(roleId)) return;

    setFetchingRoles(prev => new Set(prev).add(roleId));
    setRolePermissionsCache(prev => ({ ...prev, [roleId]: { permissions: [], loading: true, error: null } }));

    try {
      const response = await rolePermissionsApi.getRolePermissions(roleId);
      const permissions = response.data as { admin_module_id: number }[];
      const permissionIds = permissions.map((p) => p.admin_module_id.toString());
      setRolePermissionsCache(prev => ({ ...prev, [roleId]: { permissions: permissionIds, loading: false, error: null } }));
    } catch {
      setRolePermissionsCache(prev => ({ ...prev, [roleId]: { permissions: [], loading: false, error: 'Failed to fetch permissions' } }));
      toastError('Failed to fetch permissions for role');
    } finally {
      setFetchingRoles(prev => { const newSet = new Set(prev); newSet.delete(roleId); return newSet; });
    }
  }, [rolePermissionsCache, fetchingRoles, toastError]);

  // Module Selection Tree Component
  const ModuleSelectionTree = ({
    modules,
    selected,
    onChange
  }: {
    modules: Module[];
    selected: string[];
    onChange: (selected: string[]) => void;
  }) => {
    const categories = [...new Set(modules.map(m => m.category || 'Uncategorized'))];

    const toggleCategory = (category: string) => {
      setExpandedCategories(prev => {
        const newSet = new Set(prev);
        if (newSet.has(category)) {
          newSet.delete(category);
        } else {
          newSet.add(category);
        }
        return newSet;
      });
    };

    const selectAll = (category: string) => {
      const categoryModules = modules
        .filter(m => m.category === category)
        .map(m => m.admin_module_id.toString());
      const newSelected = [...new Set([...selected, ...categoryModules])];
      onChange(newSelected);
    };

    const clearAll = (category: string) => {
      const categoryModules = modules
        .filter(m => m.category === category)
        .map(m => m.admin_module_id.toString());
      const newSelected = selected.filter(id => !categoryModules.includes(id));
      onChange(newSelected);
    };

    const toggleModule = (moduleId: string) => {
      if (selected.includes(moduleId)) {
        onChange(selected.filter(id => id !== moduleId));
      } else {
        onChange([...selected, moduleId]);
      }
    };

    return (
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {categories.map(category => {
          const categoryModules = modules.filter(m => m.category === category);
          const selectedInCategory = categoryModules.filter(m =>
            selected.includes(m.admin_module_id.toString())
          ).length;
          const isExpanded = expandedCategories.has(category);

          return (
            <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex items-center text-left font-medium text-gray-900 dark:text-white"
                  aria-expanded={isExpanded}
                  aria-controls={`category-${category}`}
                >
                  {isExpanded ? (
                    <ChevronUpIcon className="w-4 h-4 mr-2" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 mr-2" />
                  )}
                  {category} ({selectedInCategory}/{categoryModules.length})
                </button>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => selectAll(category)}>
                    Select All
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => clearAll(category)}>
                    Clear All
                  </Button>
                </div>
              </div>
              {isExpanded && (
                <div className="space-y-2 pl-6" id={`category-${category}`}>
                  {categoryModules.map(mod => (
                    <Checkbox
                      key={mod.admin_module_id}
                      label={mod.module_name}
                      checked={selected.includes(mod.admin_module_id.toString())}
                      onChange={() => toggleModule(mod.admin_module_id.toString())}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const isLoading = rolesLoading || usersLoading;
  const hasError = rolesError || usersError;

  if (isLoading) {
    return (
      <ErrorBoundary>
        <RoleBasedGuard allowedRoles={['Superadmin']}>
          <PageBreadCrumb pageTitle="Roles & Permissions" />
          <div className="space-y-6">
          <ComponentCard title="Roles & Permissions Management">
            <div className="p-6">
              <SkeletonLoader className="h-6 w-1/4 mb-4" />
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                  <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="px-5 py-4 flex justify-between items-center">
                        <SkeletonLoader className="h-4 w-1/3" />
                        <SkeletonLoader className="h-4 w-1/4" />
                        <SkeletonLoader className="h-4 w-1/6" />
                        <SkeletonLoader className="h-4 w-1/5" />
                        <SkeletonLoader className="h-4 w-1/4" />
                        <SkeletonLoader className="h-8 w-20" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Tip: Use the Edit button to modify role details, Delete to remove a role, and Manage Permissions to assign modules to the role.
              </p>
            </div>
          </ComponentCard>
        </div>
      </RoleBasedGuard>
      </ErrorBoundary>
    );
  }

  if (hasError) {
    return (
      <ErrorBoundary>
        <RoleBasedGuard allowedRoles={['Superadmin']}>
          <PageBreadCrumb pageTitle="Roles & Permissions" />
          <div className="space-y-6">
            <ComponentCard title="Roles & Permissions Management">
              <div className="p-6 text-center">
                <p className="text-red-500 mb-4">{rolesError || usersError}</p>
                <Button onClick={() => { fetchUsers(); }}>Retry</Button>
              </div>
            </ComponentCard>
          </div>
        </RoleBasedGuard>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
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
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowBulkOperationsModal(true)}>
                  Bulk Operations
                </Button>
                <Button onClick={handleAddUserType}>Add User Type</Button>
              </div>
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
                        Permissions
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
                          {(() => {
                            const roleId = userType.user_type_id.toString();
                            const cached = rolePermissionsCache[roleId];
                            if (!cached) {
                              fetchPermissionsForRole(roleId);
                              return <span>Loading...</span>;
                            }
                            if (cached.loading) return <span>Loading...</span>;
                            if (cached.error) return <span className="text-red-500">Error</span>;
                            const count = cached.permissions.length;
                            return (
                              <button
                                onClick={() => {
                                  setSelectedRoleForModal(roleId);
                                  setShowPermissionsModal(true);
                                }}
                                className="text-blue-500 hover:underline"
                              >
                                {count} modules
                              </button>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm dark:text-gray-400">
                          <Button size="sm" onClick={() => handleEditUserType(userType)}><PencilIcon className="w-4 h-4 mr-1" />Edit</Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteUserType(userType.user_type_id)} className="ml-2"><TrashBinIcon className="w-4 h-4 mr-1" />Delete</Button>
                          <Button size="sm" variant="outline" onClick={() => setSelectedRole(userType.user_type_id.toString())} className="ml-2">Manage Permissions</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* Role Permissions Management */}
        <ComponentCard title="Role Permissions Management">
          <div className="p-6">
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400">
                Manage permissions for roles. Select a role and assign modules.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Role
                  </label>
                  <Select
                    options={userTypes.map(userType => ({
                      value: userType.user_type_id.toString(),
                      label: userType.user_type_name
                    }))}
                    value={selectedRole}
                    onChange={handleRoleChange}
                    placeholder="Choose a role"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Modules
                  </label>
                  {rolePermissionsLoading ? (
                    <p>Loading permissions...</p>
                  ) : rolePermissionsError ? (
                    <p className="text-red-500">{rolePermissionsError}</p>
                  ) : (
                    <ModuleSelectionTree
                      modules={modules.filter(m => m.is_active)}
                      selected={selectedRolePermissions}
                      onChange={setSelectedRolePermissions}
                    />
                  )}
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={handleSaveRolePermissions} disabled={!selectedRole || savingRolePermissions}>
                  {savingRolePermissions ? 'Saving...' : 'Save Role Permissions'}
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Tip: Select a role and use the module tree to assign or remove permissions. Changes are saved when you click the save button.
            </p>
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
                      label: `${user.firstName} ${user.lastName} (${user.email})`
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
                  <ModuleSelectionTree
                    modules={modules.filter(m => m.is_active)}
                    selected={selectedModules}
                    onChange={setSelectedModules}
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={handleSavePermissions} disabled={!selectedUser || savingUserPermissions}>
                  {savingUserPermissions ? 'Saving...' : 'Save Permissions'}
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Tip: Select a user and use the module tree to assign or remove permissions. Changes are saved when you click the save button.
            </p>
          </div>
        </ComponentCard>

        {/* Permission Matrix View */}
        <ComponentCard title="Permission Matrix">
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              View and manage granular permissions for all roles and modules.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Module / Role
                    </th>
                    {userTypes.map(role => (
                      <th key={role.user_type_id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {role.user_type_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {modules.filter(m => m.is_active).map(module => (
                    <tr key={module.admin_module_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {module.module_name}
                      </td>
                      {userTypes.map(role => {
                        const rolePermission = rolePermissions.find(rp =>
                          rp.user_type_id === role.user_type_id &&
                          rp.admin_module_id === module.admin_module_id
                        );
                        return (
                          <td key={`${role.user_type_id}-${module.admin_module_id}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {rolePermission ? (
                              <div className="flex flex-wrap gap-1">
                                {rolePermission.permissions.view && <Badge size="sm" color="success">View</Badge>}
                                {rolePermission.permissions.create && <Badge size="sm" color="info">Create</Badge>}
                                {rolePermission.permissions.edit && <Badge size="sm" color="warning">Edit</Badge>}
                                {rolePermission.permissions.delete && <Badge size="sm" color="error">Delete</Badge>}
                              </div>
                            ) : (
                              <span className="text-gray-400">No permissions</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ComponentCard>

        {/* Audit Logs Display */}
        <ComponentCard title="Permission Audit Logs">
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              View audit logs for permission changes.
            </p>
            <div className="mb-4 flex gap-4">
              <Button
                onClick={() => fetchAuditLogsForPermission(selectedRole)}
                disabled={!selectedRole || auditLoading}
              >
                {auditLoading ? 'Loading...' : 'Load Audit Logs'}
              </Button>
            </div>
            {auditLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {auditLogs.map(log => (
                      <tr key={log.audit_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <Badge size="sm" color={
                            log.action === 'create' ? 'success' :
                            log.action === 'update' ? 'warning' : 'error'
                          }>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {log.user.firstName} {log.user.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {new Date(log.created_date).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                          {log.change_reason && <div><strong>Reason:</strong> {log.change_reason}</div>}
                          {log.old_permissions && (
                            <div><strong>Old:</strong> {JSON.stringify(log.old_permissions)}</div>
                          )}
                          {log.new_permissions && (
                            <div><strong>New:</strong> {JSON.stringify(log.new_permissions)}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                {selectedRole ? 'No audit logs found for this role.' : 'Select a role to view audit logs.'}
              </p>
            )}
          </div>
        </ComponentCard>
      </div>

      {/* Permissions Modal */}
      <Modal isOpen={showPermissionsModal} onClose={() => setShowPermissionsModal(false)}>
        <div className="p-6" role="dialog" aria-labelledby="permissions-modal-title">
          <h2 id="permissions-modal-title" className="text-xl font-semibold mb-4">Role Permissions</h2>
          {selectedRoleForModal && rolePermissionsCache[selectedRoleForModal] && !rolePermissionsCache[selectedRoleForModal].loading && (
            <div className="space-y-2">
              {rolePermissionsCache[selectedRoleForModal].permissions.length === 0 ? (
                <p>No permissions assigned.</p>
              ) : (
                rolePermissionsCache[selectedRoleForModal].permissions.map(id => {
                  const mod = modules.find(m => m.admin_module_id.toString() === id);
                  return <div key={id}>{mod ? mod.module_name : `Module ${id}`}</div>;
                })
              )}
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setShowPermissionsModal(false)}>Close</Button>
          </div>
        </div>
      </Modal>

      {/* User Type Modal */}
      <Modal isOpen={showUserTypeModal} onClose={() => setShowUserTypeModal(false)}>
        <div className="p-6" role="dialog" aria-labelledby="user-type-modal-title">
          <h2 id="user-type-modal-title" className="text-xl font-semibold mb-4">
            {editingUserType ? 'Edit User Type' : 'Add User Type'}
          </h2>
          <div className="space-y-4">
            <div>
              <Label>User Type Name *</Label>
              <InputField
                value={userTypeForm.user_type_name}
                onChange={(e) => {
                  setUserTypeForm({ ...userTypeForm, user_type_name: e.target.value });
                  if (userTypeValidationErrors.user_type_name) {
                    setUserTypeValidationErrors({ ...userTypeValidationErrors, user_type_name: undefined });
                  }
                }}
                className={userTypeValidationErrors.user_type_name ? 'border-red-500' : ''}
              />
              {userTypeValidationErrors.user_type_name && (
                <p className="text-red-500 text-sm mt-1">{userTypeValidationErrors.user_type_name}</p>
              )}
            </div>
            <Switch
              label="Is Active"
              checked={userTypeForm.is_active}
              onChange={(checked) => setUserTypeForm({ ...userTypeForm, is_active: checked })}
            />
            <div>
              <Label>Permissions</Label>
              <ModuleSelectionTree
                modules={modules.filter(m => m.is_active)}
                selected={userTypeForm.permissions}
                onChange={(selected) => setUserTypeForm({ ...userTypeForm, permissions: selected })}
              />
              {userTypeForm.permissions.length === 0 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-800 text-sm flex items-center">
                    <InfoIcon className="w-4 h-4 mr-2" />
                    <strong>Warning:</strong> This role has no permissions assigned. Users with this role will have limited access.
                  </p>
                </div>
              )}
            </div>
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

      {/* Confirmation Modal */}
      <Modal isOpen={showConfirmationModal} onClose={() => setShowConfirmationModal(false)}>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Confirm Action</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{confirmationMessage}</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowConfirmationModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (onConfirmAction) onConfirmAction();
                setShowConfirmationModal(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Operations Modal */}
      <Modal isOpen={showBulkOperationsModal} onClose={() => setShowBulkOperationsModal(false)}>
        <div className="p-6" role="dialog" aria-labelledby="bulk-operations-modal-title">
          <h2 id="bulk-operations-modal-title" className="text-xl font-semibold mb-4">Bulk Operations</h2>
          <div className="space-y-4">
            <div>
              <Label>Select Roles</Label>
              <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded p-2">
                {userTypes.map(role => (
                  <Checkbox
                    key={role.user_type_id}
                    label={role.user_type_name}
                    checked={selectedRolesForBulk.includes(role.user_type_id.toString())}
                    onChange={(checked) => {
                      if (checked) {
                        setSelectedRolesForBulk(prev => [...prev, role.user_type_id.toString()]);
                      } else {
                        setSelectedRolesForBulk(prev => prev.filter(id => id !== role.user_type_id.toString()));
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label>Operation Type</Label>
              <Select
                options={[
                  { value: 'assign_permissions', label: 'Assign Permissions' },
                  { value: 'remove_permissions', label: 'Remove Permissions' },
                  { value: 'delete_roles', label: 'Delete Roles' },
                ]}
                value={bulkOperationType || ''}
                onChange={(value) => setBulkOperationType(value as 'assign_permissions' | 'remove_permissions' | 'delete_roles' | null)}
                placeholder="Choose operation"
              />
            </div>

            {(bulkOperationType === 'assign_permissions' || bulkOperationType === 'remove_permissions') && (
              <div>
                <Label>Select Modules</Label>
                <ModuleSelectionTree
                  modules={modules.filter(m => m.is_active)}
                  selected={bulkModules}
                  onChange={setBulkModules}
                />
              </div>
            )}

            {bulkOperationType === 'delete_roles' && selectedRolesForBulk.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">
                  <strong>Warning:</strong> You are about to delete {selectedRolesForBulk.length} role(s).
                  This action cannot be undone and may affect users assigned to these roles.
                </p>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowBulkOperationsModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!bulkOperationType || selectedRolesForBulk.length === 0) return;

                if (bulkOperationType === 'delete_roles') {
                  setConfirmationMessage(`Are you sure you want to delete ${selectedRolesForBulk.length} role(s)? This action cannot be undone.`);
                  setOnConfirmAction(() => async () => {
                    // Bulk delete roles
                    for (const roleId of selectedRolesForBulk) {
                      try {
                        await deleteRole(roleId);
                      } catch {
                        // Continue with other deletions
                      }
                    }
                    setShowBulkOperationsModal(false);
                    setSelectedRolesForBulk([]);
                    setBulkOperationType(null);
                  });
                  setShowConfirmationModal(true);
                } else if (bulkOperationType === 'assign_permissions' && bulkModules.length > 0) {
                  // Bulk assign permissions
                  for (const roleId of selectedRolesForBulk) {
                    try {
                      await bulkAssignPermissions(roleId, bulkModules.map(id => parseInt(id)));
                    } catch {
                      // Continue with other roles
                    }
                  }
                  setShowBulkOperationsModal(false);
                  setSelectedRolesForBulk([]);
                  setBulkModules([]);
                  setBulkOperationType(null);
                } else if (bulkOperationType === 'remove_permissions' && bulkModules.length > 0) {
                  // Bulk remove permissions
                  for (const roleId of selectedRolesForBulk) {
                    try {
                      await bulkRemovePermissions(roleId, bulkModules.map(id => parseInt(id)));
                    } catch {
                      // Continue with other roles
                    }
                  }
                  setShowBulkOperationsModal(false);
                  setSelectedRolesForBulk([]);
                  setBulkModules([]);
                  setBulkOperationType(null);
                }
              }}
              disabled={!bulkOperationType || selectedRolesForBulk.length === 0 ||
                       ((bulkOperationType === 'assign_permissions' || bulkOperationType === 'remove_permissions') && bulkModules.length === 0)}
            >
              Execute Bulk Operation
            </Button>
          </div>
        </div>
      </Modal>
      </RoleBasedGuard>
    </ErrorBoundary>
  );
};

export default RolesPermissions;