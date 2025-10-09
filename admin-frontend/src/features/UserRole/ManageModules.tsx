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
import FormWrapper from '@/components/common/FormWrapper';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import RoleBasedGuard from '@/components/auth/RoleBasedGuard';
import { adminModulesApi } from '@/shared/utils/apiClient';

interface AdminModuleFormData {
  module_name: string;
  url_slug: string;
  parent_id?: string | undefined;
  is_active: boolean;
}

interface AdminModule {
  admin_module_id: number;
  module_name: string;
  created_date: string;
  last_updated_date: string;
  is_active: boolean;
  parent_id?: number;
}

interface ModuleResponse {
  module_name: string;
  url_slug: string;
  parent_id?: number;
  is_active: boolean;
}

interface AdminModuleFormProps {
  mode: 'add' | 'edit';
  moduleId?: string;
}

const AdminModuleForm: React.FC<AdminModuleFormProps> = ({ mode, moduleId }) => {
  const router = useRouter();
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AdminModuleFormData>({
    defaultValues: {
      module_name: '',
      url_slug: '',
      parent_id: undefined,
      is_active: true,
    },
  });

  // Fetch all modules for parent dropdown
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await adminModulesApi.getAdminModules();
        setModules(response.data as AdminModule[]);
      } catch (err) {
        console.error('Failed to fetch modules:', err);
        setError('Failed to load modules');
      }
    };
    fetchModules();
  }, []);

  // Fetch module data for edit mode
  useEffect(() => {
    if (mode === 'edit' && moduleId) {
      const fetchModule = async () => {
        try {
          const response = await adminModulesApi.getAdminModule(moduleId);
          const moduleData: ModuleResponse = response.data as ModuleResponse;
          setValue('module_name', moduleData.module_name || '');
          setValue('url_slug', moduleData.url_slug || '');
          setValue('parent_id', moduleData.parent_id ? moduleData.parent_id.toString() : undefined);
          setValue('is_active', moduleData.is_active ?? true);
        } catch (err) {
          console.error('Failed to fetch module:', err);
          setError('Failed to load module data');
        }
      };
      fetchModule();
    }
  }, [mode, moduleId, setValue]);

  const onSubmit = async (data: AdminModuleFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const submitData = {
        module_name: data.module_name,
        url_slug: data.url_slug,
        parent_id: data.parent_id ? parseInt(data.parent_id) : null,
        is_active: data.is_active,
      };

      if (mode === 'add') {
        await adminModulesApi.createAdminModule(submitData);
        setSuccess('Module created successfully');
      } else {
        await adminModulesApi.updateAdminModule(moduleId!, submitData);
        setSuccess('Module updated successfully');
      }

      // Redirect to module list after success
      setTimeout(() => {
        router.push('/admin/modules');
      }, 2000);
    } catch (err: unknown) {
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving the module');
    } finally {
      setLoading(false);
    }
  };

  const parentModuleOptions = modules.map(mod => ({
    value: mod.admin_module_id.toString(),
    label: mod.module_name,
  }));

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {mode === 'add' ? 'Add New Module' : 'Edit Module'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {mode === 'add' ? 'Create a new admin module' : 'Update module information'}
        </p>
      </div>

      <FormWrapper
        onSubmit={handleSubmit(onSubmit)}
        loading={loading}
        error={error}
        success={success}
        submitButtonText={mode === 'add' ? 'Create Module' : 'Update Module'}
        onCancel={() => router.back()}
      >
        <div>
          <Label htmlFor="module_name">Module Name *</Label>
          <InputField
            {...register('module_name')}
            type="text"
            placeholder="Enter module name"
            error={!!errors.module_name}
            hint={errors.module_name?.message}
          />
        </div>

        <div>
          <Label htmlFor="url_slug">Module Slug *</Label>
          <InputField
            {...register('url_slug')}
            type="text"
            placeholder="Enter module slug"
            error={!!errors.url_slug}
            hint={errors.url_slug?.message}
          />
        </div>

        <div>
          <Label htmlFor="parent_id">Parent Module</Label>
          <Select
            options={parentModuleOptions}
            placeholder="Select parent module (optional)"
            onChange={(value) => setValue('parent_id', value)}
            defaultValue={watch('parent_id') || ''}
          />
          {errors.parent_id && (
            <p className="mt-1 text-sm text-red-600">{errors.parent_id.message}</p>
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
      </FormWrapper>
    </div>
  );
};

const ManageModulesList: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchModules();
  }, [isAuthenticated, router]);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const response = await adminModulesApi.getAdminModules();
      setModules(response.data as AdminModule[]);
    } catch (err) {
      setError('Failed to fetch modules');
      console.error('Error fetching modules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId: number) => {
    if (confirm('Are you sure you want to delete this module?')) {
      try {
        await adminModulesApi.deleteAdminModule(moduleId.toString());
        setModules(modules.filter(module => module.admin_module_id !== moduleId));
      } catch (err) {
        setError('Failed to delete module');
        console.error('Error deleting module:', err);
      }
    }
  };

  if (loading) {
    return (
      <RoleBasedGuard allowedRoles={['Superadmin']}>
        <PageBreadCrumb pageTitle="Manage Modules" />
        <div className="space-y-6">
          <ComponentCard title="Module Management">
            <div className="p-6 text-center">
              <p>Loading modules...</p>
            </div>
          </ComponentCard>
        </div>
      </RoleBasedGuard>
    );
  }

  if (error) {
    return (
      <RoleBasedGuard allowedRoles={['Superadmin']}>
        <PageBreadCrumb pageTitle="Manage Modules" />
        <div className="space-y-6">
          <ComponentCard title="Module Management">
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
      <PageBreadCrumb pageTitle="Manage Modules" />
      <div className="space-y-6">
        <ComponentCard title="Module Management">
          <div className="p-6">
            <div className="mb-4 flex justify-between items-center">
              <p className="text-gray-600 dark:text-gray-400">
                Manage system modules and their configurations. Create, edit, and organize
                modules that define the structure and functionality of the application.
              </p>
              <Button onClick={() => router.push('/admin/modules/add')}>Add New Module</Button>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <div className="min-w-[800px]">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Module Name
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
                      {modules.map((module) => (
                        <TableRow key={module.admin_module_id}>
                          <TableCell className="px-5 py-4 sm:px-6 text-start">
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {module.module_name}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {new Date(module.created_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {new Date(module.last_updated_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            <Badge size="sm" color={module.is_active ? "success" : "error"}>
                              {module.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/admin/modules/edit/${module.admin_module_id}`)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteModule(module.admin_module_id)}
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
    </RoleBasedGuard>
  );
};

export { AdminModuleForm, ManageModulesList };
export default ManageModulesList;