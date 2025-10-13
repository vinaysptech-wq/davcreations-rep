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
import TextArea from '@/components/form/input/TextArea';
import FormWrapper from '@/components/common/FormWrapper';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import DataTable, { ColumnDefinition, ActionConfig } from '@/components/common/DataTable';
import { useAuth } from '@/features/auth/hooks/useAuth';
import RoleBasedGuard from '@/components/auth/RoleBasedGuard';
import { adminModulesApi } from '@/shared/utils/apiClient';
import { useToast } from '@/hooks/useToast';

interface AdminModuleFormData {
  module_name: string;
  url_slug: string;
  parent_id?: string | undefined;
  is_active: boolean;
  tool_tip?: string;
  short_description?: string;
  category?: string;
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
  tool_tip?: string;
  short_description?: string;
  category?: string;
}

interface AdminModuleFormProps {
  mode: 'add' | 'edit';
  moduleId?: string;
}

const AdminModuleForm: React.FC<AdminModuleFormProps> = ({ mode, moduleId }) => {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
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
      tool_tip: '',
      short_description: '',
      category: '',
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
          setValue('tool_tip', moduleData.tool_tip || '');
          setValue('short_description', moduleData.short_description || '');
          setValue('category', moduleData.category || '');
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
      // Transform form data to match API expectations
      // Convert parent_id from string to number or null
      const submitData = {
        module_name: data.module_name,
        url_slug: data.url_slug,
        parent_id: data.parent_id ? parseInt(data.parent_id) : null,
        is_active: data.is_active,
        tool_tip: data.tool_tip,
        short_description: data.short_description,
        category: data.category,
      };

      // Create new module or update existing one based on mode
      if (mode === 'add') {
        await adminModulesApi.createAdminModule(submitData);
        toastSuccess('Module created successfully');
        setSuccess('Module created successfully');
      } else {
        await adminModulesApi.updateAdminModule(moduleId!, submitData);
        toastSuccess('Module updated successfully');
        setSuccess('Module updated successfully');
      }

      // Redirect to module list after successful operation with delay for user feedback
      setTimeout(() => {
        router.push('/admin/UserRole/ManageModules');
      }, 2000);
    } catch (err: unknown) {
      console.error('Form submission error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while saving the module';
      toastError(errorMessage);
      setError(errorMessage);
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
            {...register('module_name', {
              required: 'Module name is required',
              minLength: { value: 2, message: 'Module name must be at least 2 characters' },
              maxLength: { value: 100, message: 'Module name must be less than 100 characters' }
            })}
            type="text"
            placeholder="Enter module name"
            error={!!errors.module_name}
            hint={errors.module_name?.message}
          />
        </div>

        <div>
          <Label htmlFor="url_slug">Module Slug *</Label>
          <InputField
            {...register('url_slug', {
              required: 'URL slug is required',
              pattern: {
                value: /^[a-z0-9-]+$/,
                message: 'URL slug can only contain lowercase letters, numbers, and hyphens'
              },
              minLength: { value: 2, message: 'URL slug must be at least 2 characters' }
            })}
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
          <Label htmlFor="tool_tip">Tool Tip</Label>
          <InputField
            {...register('tool_tip', {
              maxLength: { value: 255, message: 'Tool tip must be less than 255 characters' }
            })}
            type="text"
            placeholder="Enter tool tip (optional)"
            error={!!errors.tool_tip}
            hint={errors.tool_tip?.message}
          />
        </div>

        <div>
          <Label htmlFor="short_description">Short Description</Label>
          <TextArea
            {...register('short_description', {
              maxLength: { value: 500, message: 'Short description must be less than 500 characters' }
            })}
            placeholder="Enter short description (optional)"
            error={!!errors.short_description}
            hint={errors.short_description?.message}
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <InputField
            {...register('category', {
              maxLength: { value: 255, message: 'Category must be less than 255 characters' }
            })}
            type="text"
            placeholder="Enter category (optional)"
            error={!!errors.category}
            hint={errors.category?.message}
          />
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
  const { success: toastSuccess, error: toastError } = useToast();
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

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

  const handleRefresh = () => {
    fetchModules();
  };

  const handleDeleteModule = async (module: AdminModule) => {
    // Show confirmation dialog before deletion
    if (confirm('Are you sure you want to delete this module?')) {
      // Add module to deleting set to show loading state in UI
      setDeletingIds(prev => new Set(prev).add(module.admin_module_id));
      try {
        // Call API to delete the module
        await adminModulesApi.deleteAdminModule(module.admin_module_id.toString());
        // Remove module from local state on successful deletion
        setModules(modules.filter(m => m.admin_module_id !== module.admin_module_id));
        toastSuccess('Module deleted successfully');
      } catch (err) {
        toastError('Failed to delete module');
        console.error('Error deleting module:', err);
      } finally {
        // Remove module from deleting set regardless of success/failure
        setDeletingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(module.admin_module_id);
          return newSet;
        });
      }
    }
  };

  // DataTable configuration
  const columns: ColumnDefinition<AdminModule>[] = [
    {
      key: 'module_name',
      header: 'Module Name',
      render: (module) => (
        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {module.module_name}
        </span>
      ),
    },
    {
      key: 'created_date',
      header: 'Created Date',
      render: (module) => new Date(module.created_date).toLocaleDateString(),
    },
    {
      key: 'last_updated_date',
      header: 'Last Updated Date',
      render: (module) => new Date(module.last_updated_date).toLocaleDateString(),
    },
    {
      key: 'is_active',
      header: 'Is Active',
      render: (module) => (
        <Badge size="sm" color={module.is_active ? "success" : "error"}>
          {module.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const actions: ActionConfig<AdminModule>[] = [
    {
      key: 'edit',
      label: 'Edit',
      onClick: (module) => {
        console.log('Navigating to edit module page:', module.admin_module_id);
        router.push(`/admin/UserRole/ManageModules/edit/${module.admin_module_id}`);
      },
      variant: 'outline',
    },
    {
      key: 'delete',
      label: 'Delete',
      onClick: handleDeleteModule,
      variant: 'outline',
      disabled: (module) => deletingIds.has(module.admin_module_id),
      loading: (module) => deletingIds.has(module.admin_module_id),
    },
  ];


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
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRefresh}>Refresh</Button>
                <Button onClick={() => router.push('/admin/UserRole/ManageModules/add')}>Add New Module</Button>
              </div>
            </div>

            <DataTable
              data={modules}
              columns={columns}
              loading={loading}
              error={error}
              actions={actions}
              emptyMessage="No modules found"
            />
          </div>
        </ComponentCard>
      </div>
    </RoleBasedGuard>
  );
};

export { AdminModuleForm, ManageModulesList };
export default ManageModulesList;