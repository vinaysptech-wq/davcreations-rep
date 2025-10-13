"use client";
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import InputField from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Switch from '@/components/form/switch/Switch';
import Checkbox from '@/components/form/input/Checkbox';
import TextArea from '@/components/form/input/TextArea';
import FormWrapper from '@/components/common/FormWrapper';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import Alert from '@/components/ui/alert/Alert';
import DataTable, { ColumnDefinition, ActionConfig } from '@/components/common/DataTable';
import { apiClient } from '@/shared/utils/apiClient';
import { usersApi } from '@/features/UserRole/apis';
import { useUserPermissions } from '@/features/UserRole/hooks';
import { Permission, Module } from '@/features/UserRole/types';

interface UserFormData {
  first_name: string;
  last_name: string;
  email: string;
  user_type_id: string;
  user_password?: string;
  confirm_password?: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  bank_name: string;
  bank_ifsc_code: string;
  bank_account_number: string;
  bank_address: string;
  is_active: boolean;
}

interface UserType {
  user_type_id: number;
  user_type_name: string;
}

interface AdminModule {
  admin_module_id: number;
  module_name: string;
}

interface UserResponse {
  first_name: string;
  last_name: string;
  email: string;
  user_typeid: string;
  address: string;
  city?: string;
  state?: string;
  phone: string;
  bank_name: string;
  bank_ifsc_code: string;
  bank_account_number: string;
  bank_address: string;
  is_active: boolean;
}

interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  user_type?: {
    user_type_name: string;
  };
  created_date: string;
  last_updated_date: string;
  is_active: boolean;
}

interface UserFormProps {
  mode: 'add' | 'edit';
  userId?: string;
}

const UserForm: React.FC<UserFormProps> = ({ mode, userId }) => {
  const router = useRouter();
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Permission management - handles complex permission system with role-based and user-specific permissions
  // userPermissions: User-specific permission overrides that take precedence over role permissions
  // rolePermissions: Default permissions based on user's role/type
  // permissionModules: List of all available modules for permission assignment
  const { userPermissions, rolePermissions, modules: permissionModules, loading: permissionsLoading, fetchUserPermissions, assignUserPermission, removeUserPermission } = useUserPermissions();
  const [userSpecificPermissions, setUserSpecificPermissions] = useState<{ [key: number]: Permission }>({});
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedModuleForPermission, setSelectedModuleForPermission] = useState<AdminModule | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UserFormData>({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      user_type_id: '',
      user_password: '',
      confirm_password: '',
      address: '',
      city: '',
      state: '',
      phone: '',
      bank_name: '',
      bank_ifsc_code: '',
      bank_account_number: '',
      bank_address: '',
      is_active: true,
    },
  });

  

  // Fetch user types
  useEffect(() => {
    const fetchUserTypes = async () => {
      try {
        const response = await apiClient.get('/api/userTypes');
        setUserTypes(response.data as UserType[]);
      } catch (err) {
        console.error('Failed to fetch user types:', err);
        setError('Failed to load user types');
      }
    };
    fetchUserTypes();
  }, []);

  // Fetch modules
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await usersApi.getModules();
        setModules(response.data as Module[]);
      } catch (err) {
        console.error('Failed to fetch modules:', err);
        setError('Failed to load modules');
      }
    };
    fetchModules();
  }, []);

  // Fetch user data for edit mode
  useEffect(() => {
    if (mode === 'edit' && userId) {
      const fetchUser = async () => {
        try {
          const response = await apiClient.get(`/api/users/${userId}`);
          const user: UserResponse = response.data as UserResponse;

          setValue('first_name', user.first_name || '');
          setValue('last_name', user.last_name || '');
          setValue('email', user.email || '');
          setValue('user_type_id', user.user_typeid || '');
          setValue('address', user.address || '');
          setValue('city', user.city || '');
          setValue('state', user.state || '');
          setValue('phone', user.phone || '');
          setValue('bank_name', user.bank_name || '');
          setValue('bank_ifsc_code', user.bank_ifsc_code || '');
          setValue('bank_account_number', user.bank_account_number || '');
          setValue('bank_address', user.bank_address || '');
          setValue('is_active', user.is_active ?? true);

          // Fetch user modules
          const userModulesResponse = await usersApi.getUserModules(userId);
          setSelectedModules((userModulesResponse.data as { modules: string[] }).modules);

          // Fetch user permissions
          await fetchUserPermissions(userId);

          
        } catch (err) {
          console.error('Failed to fetch user:', err);
          setError('Failed to load user data');
        }
      };
      fetchUser();
    }
  }, [mode, userId, setValue, fetchUserPermissions]);

  const onSubmit = async (data: UserFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare submission data - remove password fields for edit mode since they're not updated
      const submitData = { ...data };
      if (mode === 'edit') {
        delete submitData.user_password;
        delete submitData.confirm_password;
      }

      let userIdToUpdate = userId;

      // Create new user or update existing user
      if (mode === 'add') {
        const newUserResponse = await apiClient.post('/api/users', submitData);
        userIdToUpdate = (newUserResponse.data as { user_id: string }).user_id;
        setSuccess('User created successfully');
      } else {
        await apiClient.put(`/api/users/${userId}`, submitData);
        setSuccess('User updated successfully');
      }

      // Update user module assignments after user creation/update
      if (userIdToUpdate) {
        await usersApi.updateUserModules(userIdToUpdate, { modules: selectedModules });
      }

      // Redirect to user list after successful operation with delay for user feedback
      setTimeout(() => {
        router.push('/admin/UserRole/AdminUsers');
      }, 2000);
    } catch (err: unknown) {
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving the user');
    } finally {
      setLoading(false);
    }
  };

  const userTypeOptions = userTypes.map(type => ({
    value: type.user_type_id.toString(),
    label: type.user_type_name,
  }));

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {mode === 'add' ? 'Add New User' : 'Edit User'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {mode === 'add' ? 'Create a new user account' : 'Update user information'}
        </p>
      </div>

      <FormWrapper
        onSubmit={handleSubmit(onSubmit)}
        loading={loading}
        error={error}
        success={success}
        submitButtonText={mode === 'add' ? 'Create User' : 'Update User'}
        onCancel={() => router.back()}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="first_name">First Name *</Label>
            <InputField
              {...register('first_name')}
              type="text"
              placeholder="Enter first name"
              error={!!errors.first_name}
              hint={errors.first_name?.message}
            />
          </div>

          <div>
            <Label htmlFor="last_name">Last Name *</Label>
            <InputField
              {...register('last_name')}
              type="text"
              placeholder="Enter last name"
              error={!!errors.last_name}
              hint={errors.last_name?.message}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <InputField
            {...register('email')}
            type="email"
            placeholder="Enter email address"
            error={!!errors.email}
            hint={errors.email?.message}
          />
        </div>

        <div>
          <Label htmlFor="userTypeId">User Type *</Label>
          <Select
            options={userTypeOptions}
            placeholder="Select user type"
            onChange={(value) => setValue('user_type_id', value)}
            defaultValue={watch('user_type_id')}
          />
          {errors.user_type_id && (
            <p className="mt-1 text-sm text-red-600">{errors.user_type_id.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="is_active">Is Active *</Label>
          <Switch
            {...register('is_active')}
            checked={watch('is_active')}
            onChange={(checked) => setValue('is_active', checked)}
          />
          {errors.is_active && (
            <p className="mt-1 text-sm text-red-600">{errors.is_active.message}</p>
          )}
        </div>

        {mode === 'add' && (
          <>
            <div>
              <Label htmlFor="user_password">Password *</Label>
              <InputField
                {...register('user_password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
                type="password"
                placeholder="Enter password"
                error={!!errors.user_password}
                hint={errors.user_password?.message}
              />
            </div>

            <div>
              <Label htmlFor="confirm_password">Confirm Password *</Label>
              <InputField
                {...register('confirm_password', {
                  required: 'Please confirm your password',
                  validate: (value) => value === watch('user_password') || 'Passwords do not match'
                })}
                type="password"
                placeholder="Confirm password"
                error={!!errors.confirm_password}
                hint={errors.confirm_password?.message}
              />
            </div>
          </>
        )}

        <div>
          <Label htmlFor="address">Address *</Label>
          <TextArea
            {...register('address')}
            placeholder="Enter address"
            rows={3}
            error={!!errors.address}
            hint={errors.address?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="city">City</Label>
            <InputField
              {...register('city')}
              type="text"
              placeholder="Enter city"
              error={!!errors.city}
              hint={errors.city?.message}
            />
          </div>

          <div>
            <Label htmlFor="state">State</Label>
            <InputField
              {...register('state')}
              type="text"
              placeholder="Enter state"
              error={!!errors.state}
              hint={errors.state?.message}
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone *</Label>
            <InputField
              {...register('phone')}
              type="tel"
              placeholder="Enter phone"
              error={!!errors.phone}
              hint={errors.phone?.message}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Bank Details</h3>

          <div>
            <Label htmlFor="bank_name">Bank Name *</Label>
            <InputField
              {...register('bank_name')}
              type="text"
              placeholder="Enter bank name"
              error={!!errors.bank_name}
              hint={errors.bank_name?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="bank_ifsc_code">IFSC Code *</Label>
              <InputField
                {...register('bank_ifsc_code')}
                type="text"
                placeholder="Enter IFSC code"
                error={!!errors.bank_ifsc_code}
                hint={errors.bank_ifsc_code?.message}
              />
            </div>

            <div>
              <Label htmlFor="bank_account_number">Account Number *</Label>
              <InputField
                {...register('bank_account_number')}
                type="text"
                placeholder="Enter account number"
                error={!!errors.bank_account_number}
                hint={errors.bank_account_number?.message}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bank_address">Bank Address *</Label>
            <TextArea
              {...register('bank_address')}
              placeholder="Enter bank address"
              rows={3}
              error={!!errors.bank_address}
              hint={errors.bank_address?.message}
            />
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Roles & Permissions</h3>

          {/* Module Access */}
          <div>
            <Label>Modules Access</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Select the modules this user should have access to.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {modules.map((module) => (
                <Checkbox
                  key={module.admin_module_id}
                  label={module.module_name}
                  checked={selectedModules.includes(module.admin_module_id.toString())}
                  onChange={(checked) => {
                    if (checked) {
                      setSelectedModules(prev => [...prev, module.admin_module_id.toString()]);
                    } else {
                      setSelectedModules(prev => prev.filter(id => id !== module.admin_module_id.toString()));
                    }
                  }}
                />
              ))}
            </div>
          </div>

          {/* Granular Permissions */}
          {mode === 'edit' && userId && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label>Granular Permissions</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPermissionModal(true)}
                >
                  Manage Permissions
                </Button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Configure specific permissions for this user. User-specific permissions override role permissions.
              </p>

              {permissionsLoading ? (
                <div className="text-center py-4">Loading permissions...</div>
              ) : (
                // Display effective permissions for each module
                // Shows combined view of role permissions and user-specific overrides
                // User permissions take precedence over role permissions
                <div className="space-y-3">
                  {permissionModules.map((module) => {
                    // Find user-specific and role-based permissions for this module
                    const userPerm = userPermissions.find(p => p.admin_module_id === module.admin_module_id);
                    const rolePerm = rolePermissions.find(p => p.admin_module_id === module.admin_module_id);
                    // Effective permission is user override if exists, otherwise role default
                    const effectivePerm = userPerm || rolePerm;

                    if (!effectivePerm) return null;

                    return (
                      <div key={module.admin_module_id} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{module.module_name}</h4>
                            {/* Display active permission badges (View, Create, Edit, Delete) */}
                            <div className="flex gap-2 mt-1">
                              {effectivePerm.permissions.view && (
                                <Badge size="sm" color="success">View</Badge>
                              )}
                              {effectivePerm.permissions.create && (
                                <Badge size="sm" color="info">Create</Badge>
                              )}
                              {effectivePerm.permissions.edit && (
                                <Badge size="sm" color="warning">Edit</Badge>
                              )}
                              {effectivePerm.permissions.delete && (
                                <Badge size="sm" color="error">Delete</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {/* Indicate whether permission comes from user override or role default */}
                            <Badge
                              size="sm"
                              color={userPerm ? "primary" : "light"}
                            >
                              {userPerm ? "User Override" : "Role Default"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </FormWrapper>

      {/* Permission Management Modal */}
      <Modal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        className="max-w-4xl"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Manage User Permissions
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Role Permissions */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Role Permissions</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {rolePermissions.map((perm) => (
                    <div key={perm.admin_module_id} className="border rounded p-3">
                      <div className="font-medium">{perm.admin_module.module_name}</div>
                      <div className="flex gap-1 mt-1">
                        {perm.permissions.view && <Badge size="sm" color="success">V</Badge>}
                        {perm.permissions.create && <Badge size="sm" color="info">C</Badge>}
                        {perm.permissions.edit && <Badge size="sm" color="warning">E</Badge>}
                        {perm.permissions.delete && <Badge size="sm" color="error">D</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Overrides */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">User Overrides</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {userPermissions
                    .filter(perm => perm.source === 'user')
                    .map((perm) => (
                      <div key={perm.admin_module_id} className="border rounded p-3 bg-blue-50 dark:bg-blue-900/20">
                        <div className="font-medium">{perm.admin_module.module_name}</div>
                        <div className="flex gap-1 mt-1">
                          {perm.permissions.view && <Badge size="sm" color="success">V</Badge>}
                          {perm.permissions.create && <Badge size="sm" color="info">C</Badge>}
                          {perm.permissions.edit && <Badge size="sm" color="warning">E</Badge>}
                          {perm.permissions.delete && <Badge size="sm" color="error">D</Badge>}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => {
                            if (userId) {
                              removeUserPermission(userId, perm.admin_module_id.toString());
                            }
                          }}
                        >
                          Remove Override
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Add New Override */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Add Permission Override</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Select Module</Label>
                  <Select
                    options={permissionModules.map(m => ({
                      value: m.admin_module_id.toString(),
                      label: m.module_name
                    }))}
                    placeholder="Choose module"
                    onChange={(value) => {
                      const selectedModule = permissionModules.find(m => m.admin_module_id.toString() === value);
                      setSelectedModuleForPermission(selectedModule || null);
                    }}
                  />
                </div>
                {selectedModuleForPermission && (
                  <div>
                    <Label>Permissions</Label>
                    <div className="flex gap-2 mt-2">
                      <Checkbox
                        label="View"
                        checked={userSpecificPermissions[selectedModuleForPermission.admin_module_id]?.view || false}
                        onChange={(checked) => {
                          setUserSpecificPermissions(prev => ({
                            ...prev,
                            [selectedModuleForPermission.admin_module_id]: {
                              ...prev[selectedModuleForPermission.admin_module_id],
                              view: checked
                            }
                          }));
                        }}
                      />
                      <Checkbox
                        label="Create"
                        checked={userSpecificPermissions[selectedModuleForPermission.admin_module_id]?.create || false}
                        onChange={(checked) => {
                          setUserSpecificPermissions(prev => ({
                            ...prev,
                            [selectedModuleForPermission.admin_module_id]: {
                              ...prev[selectedModuleForPermission.admin_module_id],
                              create: checked
                            }
                          }));
                        }}
                      />
                      <Checkbox
                        label="Edit"
                        checked={userSpecificPermissions[selectedModuleForPermission.admin_module_id]?.edit || false}
                        onChange={(checked) => {
                          setUserSpecificPermissions(prev => ({
                            ...prev,
                            [selectedModuleForPermission.admin_module_id]: {
                              ...prev[selectedModuleForPermission.admin_module_id],
                              edit: checked
                            }
                          }));
                        }}
                      />
                      <Checkbox
                        label="Delete"
                        checked={userSpecificPermissions[selectedModuleForPermission.admin_module_id]?.delete || false}
                        onChange={(checked) => {
                          setUserSpecificPermissions(prev => ({
                            ...prev,
                            [selectedModuleForPermission.admin_module_id]: {
                              ...prev[selectedModuleForPermission.admin_module_id],
                              delete: checked
                            }
                          }));
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              {selectedModuleForPermission && (
                <Button
                  className="mt-4"
                  onClick={() => {
                    if (userId && selectedModuleForPermission) {
                      const permissions = userSpecificPermissions[selectedModuleForPermission.admin_module_id] || { view: false, create: false, edit: false, delete: false };
                      assignUserPermission(userId, selectedModuleForPermission.admin_module_id, permissions);
                      setSelectedModuleForPermission(null);
                      setUserSpecificPermissions(prev => {
                        const newPerms = { ...prev };
                        delete newPerms[selectedModuleForPermission.admin_module_id];
                        return newPerms;
                      });
                    }
                  }}
                >
                  Add Override
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowPermissionModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const AdminUsersList: React.FC = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Note: Bulk operations functionality requires backend API support
  // // Bulk operations
  // const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  // const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  // const [bulkPermissions, setBulkPermissions] = useState<Permission>({ view: false, create: false, edit: false, delete: false });
  // const [selectedModuleForBulk, setSelectedModuleForBulk] = useState<string>('');
  // const { modules: permissionModules } = useUserPermissions();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getUsers();
      setUsers((response.data as { users: User[] }).users);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await usersApi.deleteUser(userToDelete.user_id);
      setUsers(users.filter(user => user.user_id !== userToDelete.user_id));
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err) {
      setDeleteError('Failed to delete user. Please try again.');
      console.error('Error deleting user:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
    setDeleteError(null);
  };

  // Note: Bulk operations functionality requires backend API support
  // const handleSelectAllUsers = (checked: boolean) => {
  //   if (checked) {
  //     setSelectedUsers(users.map(user => user.user_id));
  //   } else {
  //     setSelectedUsers([]);
  //   }
  // };

  // const handleSelectUser = (userId: string, checked: boolean) => {
  //   if (checked) {
  //     setSelectedUsers(prev => [...prev, userId]);
  //   } else {
  //     setSelectedUsers(prev => prev.filter(id => id !== userId));
  //   }
  // };

  // Note: Bulk operations functionality requires backend API support
  // const handleBulkAssignPermissions = async () => {
  //   if (selectedUsers.length === 0 || !selectedModuleForBulk) return;
  //
  //   try {
  //     const moduleId = parseInt(selectedModuleForBulk);
  //
  //     // Assign permissions to all selected users
  //     for (const userId of selectedUsers) {
  //       await usersApi.bulkAssignPermissions(userId, [moduleId]);
  //     }
  //
  //     setIsBulkModalOpen(false);
  //     setSelectedUsers([]);
  //     setSelectedModuleForBulk('');
  //     setBulkPermissions({ view: false, create: false, edit: false, delete: false });
  //     // Refresh users list
  //     fetchUsers();
  //   } catch (error) {
  //     console.error('Bulk permission assignment failed:', error);
  //   }
  // };

  // DataTable configuration
  const columns: ColumnDefinition<User>[] = [
    {
      key: 'first_name',
      header: 'First Name',
      render: (user) => (
        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {user.first_name}
        </span>
      ),
    },
    {
      key: 'last_name',
      header: 'Last Name',
      render: (user) => user.last_name,
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (user) => user.phone,
    },
    {
      key: 'email',
      header: 'Email',
      render: (user) => user.email,
    },
    {
      key: 'created_date',
      header: 'Created Date',
      render: (user) => new Date(user.created_date).toLocaleDateString(),
    },
    {
      key: 'last_updated_date',
      header: 'Last Updated Date',
      render: (user) => new Date(user.last_updated_date).toLocaleDateString(),
    },
    {
      key: 'is_active',
      header: 'Is Active',
      render: (user) => (
        <Badge size="sm" color={user.is_active ? "success" : "error"}>
          {user.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const actions: ActionConfig<User>[] = [
    {
      key: 'edit',
      label: 'Edit',
      onClick: (user) => router.push(`/admin/UserRole/AdminUsers/edit/${user.user_id}`),
      variant: 'outline',
    },
    {
      key: 'delete',
      label: 'Delete',
      onClick: handleDeleteClick,
      variant: 'outline',
    },
  ];

  // Note: Bulk operations functionality requires backend API support
  // const bulkOperations: BulkOperationConfig<User> = {
  //   onSelectAll: handleSelectAllUsers,
  //   onSelectItem: (user, selected) => handleSelectUser(user.user_id, selected),
  //   isSelected: (user) => selectedUsers.includes(user.user_id),
  //   selectedCount: selectedUsers.length,
  //   bulkActions: [
  //     {
  //       label: `Bulk Assign Permissions (${selectedUsers.length})`,
  //       onClick: () => setIsBulkModalOpen(true),
  //       disabled: selectedUsers.length === 0,
  //       variant: 'outline',
  //     },
  //   ],
  // };


  return (
    <>
      <PageBreadCrumb pageTitle="Admin Users" />
      <div className="space-y-6">
        <ComponentCard title="Admin Users Management">
          <div className="p-6">
           <div className="mb-4 flex justify-between items-center">
             <p className="text-gray-600 dark:text-gray-400">
               Manage administrative users in the system. Create, edit, and manage admin accounts
               with different access levels and permissions.
             </p>
             <div className="flex gap-2">
               {/* Note: Bulk operations functionality requires backend API support */}
               {/* {selectedUsers.length > 0 && (
                 <Button
                   variant="outline"
                   onClick={() => setIsBulkModalOpen(true)}
                 >
                   Bulk Assign Permissions ({selectedUsers.length})
                 </Button>
               )} */}
               <Button onClick={() => router.push('/admin/UserRole/AdminUsers/add')}>Add New User</Button>
             </div>
           </div>

            <DataTable
              data={users}
              columns={columns}
              loading={loading}
              error={error}
              actions={actions}
              emptyMessage="No users found"
            />
          </div>
        </ComponentCard>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        className="max-w-md"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Confirm Delete
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to delete the user &apos;{userToDelete?.first_name} {userToDelete?.last_name}&apos;?
            This action cannot be undone.
          </p>

          {deleteError && (
            <div className="mb-4">
              <Alert
                variant="error"
                title="Delete Failed"
                message={deleteError}
              />
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Note: Bulk operations functionality requires backend API support */}
      {/* Bulk Permissions Modal */}
      {/* <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        className="max-w-md"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Bulk Assign Permissions
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Assign permissions to {selectedUsers.length} selected user(s).
          </p>

          <div className="space-y-4">
            <div>
              <Label>Select Module</Label>
              <Select
                options={permissionModules.map(m => ({
                  value: m.admin_module_id.toString(),
                  label: m.module_name
                }))}
                placeholder="Choose module"
                onChange={setSelectedModuleForBulk}
                value={selectedModuleForBulk}
              />
            </div>

            <div>
              <Label>Permissions to Assign</Label>
              <div className="flex gap-4 mt-2">
                <Checkbox
                  label="View"
                  checked={bulkPermissions.view}
                  onChange={(checked) => setBulkPermissions(prev => ({ ...prev, view: checked }))}
                />
                <Checkbox
                  label="Create"
                  checked={bulkPermissions.create}
                  onChange={(checked) => setBulkPermissions(prev => ({ ...prev, create: checked }))}
                />
                <Checkbox
                  label="Edit"
                  checked={bulkPermissions.edit}
                  onChange={(checked) => setBulkPermissions(prev => ({ ...prev, edit: checked }))}
                />
                <Checkbox
                  label="Delete"
                  checked={bulkPermissions.delete}
                  onChange={(checked) => setBulkPermissions(prev => ({ ...prev, delete: checked }))}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <Button
              variant="outline"
              onClick={() => setIsBulkModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAssignPermissions}
              disabled={!selectedModuleForBulk}
            >
              Assign Permissions
            </Button>
          </div>
        </div>
      </Modal> */}
    </>
  );
};

export { UserForm, AdminUsersList };
export default AdminUsersList;