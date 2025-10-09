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
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import Alert from '@/components/ui/alert/Alert';
import { apiClient } from '@/shared/utils/apiClient';
import { usersApi } from '@/features/UserRole/apis';

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

interface Module {
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
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        } catch (err) {
          console.error('Failed to fetch user:', err);
          setError('Failed to load user data');
        }
      };
      fetchUser();
    }
  }, [mode, userId, setValue]);

  const onSubmit = async (data: UserFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const submitData = { ...data };
      if (mode === 'edit') {
        delete submitData.user_password;
        delete submitData.confirm_password;
      }

      let userIdToUpdate = userId;
      if (mode === 'add') {
        const newUserResponse = await apiClient.post('/api/users', submitData);
        userIdToUpdate = (newUserResponse.data as { user_id: string }).user_id;
        setSuccess('User created successfully');
      } else {
        await apiClient.put(`/api/users/${userId}`, submitData);
        setSuccess('User updated successfully');
      }

      // Update user modules
      if (userIdToUpdate) {
        await usersApi.updateUserModules(userIdToUpdate, { modules: selectedModules });
      }

      // Redirect to user list after success
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
                {...register('user_password')}
                type="password"
                placeholder="Enter password"
                error={!!errors.user_password}
                hint={errors.user_password?.message}
              />
            </div>

            <div>
              <Label htmlFor="confirm_password">Confirm Password *</Label>
              <InputField
                {...register('confirm_password')}
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

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Roles & Permissions</h3>

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
        </div>
      </FormWrapper>
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

  if (loading) {
    return (
      <>
        <PageBreadCrumb pageTitle="Admin Users" />
        <div className="space-y-6">
          <ComponentCard title="Admin Users Management">
            <div className="p-6 text-center">
              <p>Loading users...</p>
            </div>
          </ComponentCard>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageBreadCrumb pageTitle="Admin Users" />
        <div className="space-y-6">
          <ComponentCard title="Admin Users Management">
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
      <PageBreadCrumb pageTitle="Admin Users" />
      <div className="space-y-6">
        <ComponentCard title="Admin Users Management">
          <div className="p-6">
            <div className="mb-4 flex justify-between items-center">
              <p className="text-gray-600 dark:text-gray-400">
                Manage administrative users in the system. Create, edit, and manage admin accounts
                with different access levels and permissions.
              </p>
              <Button onClick={() => router.push('/admin/UserRole/AdminUsers/add')}>Add New User</Button>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <div className="min-w-[800px]">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          First Name
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Last Name
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Phone
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Email
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
                      {users.map((user) => (
                        <TableRow key={user.user_id}>
                          <TableCell className="px-5 py-4 sm:px-6 text-start">
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {user.first_name}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {user.last_name}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {user.phone}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {user.email}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {new Date(user.created_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {new Date(user.last_updated_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            <Badge size="sm" color={user.is_active ? "success" : "error"}>
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/admin/UserRole/AdminUsers/edit/${user.user_id}`)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteClick(user)}
                              >
                                Delete
                              </Button>
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
    </>
  );
};

export { UserForm, AdminUsersList };
export default AdminUsersList;