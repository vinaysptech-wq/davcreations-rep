'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import UserTable from '@/features/UserRole/RolesPermissionsTable';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  userType: string;
}
interface ApiUser {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_date: string;
  last_updated_date: string;
  is_active: boolean;
  user_type?: {
    user_type_name: string;
  };
}
export interface UserType {
  user_type_id: number;
  user_type_name: string;
  is_active: boolean;
}

interface Module {
  id: string;
  name: string;
  category: string;
  url_slug?: string;
  is_active: boolean;
}

interface ApiModule {
  admin_module_id: number;
  module_name: string;
  category: string;
  url_slug?: string;
  is_active: boolean;
}

export default function UserRoleManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'modules' | 'logs'>('users');

  // Users states
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    user_type_id: '',
    email: '',
    user_password: '',
    confirm_password: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    bank_name: '',
    bank_ifsc_code: '',
    bank_account_number: '',
    bank_address: '',
    is_active: true,
  });
  const [formError, setFormError] = useState('');

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Roles states
  const [roles, setRoles] = useState<UserType[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [errorRoles, setErrorRoles] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRole, setEditingRole] = useState<UserType | null>(null);
  const [roleFormData, setRoleFormData] = useState({
    user_type_name: '',
    is_active: true,
  });

  // Modules states
  const [modulesUsers, setModulesUsers] = useState<User[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleUserId, setSelectedModuleUserId] = useState<string>('');
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [errorModules, setErrorModules] = useState('');
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleFormData, setModuleFormData] = useState({
    module_name: '',
    category: '',
    url_slug: '',
    is_active: true,
  });

  // Logs states
  const [logLevel, setLogLevel] = useState<string>('info');
  const [logs, setLogs] = useState<string>('');
  const [loadingLogs, setLoadingLogs] = useState(true);

  const fetchUsersCallback = useCallback(async (token: string) => {
    try {
      setErrorUsers('');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users?page=${currentPage}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const mappedUsers = data.users.map((user: ApiUser) => ({
          id: user.user_id.toString(),
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          email: user.email,
          createdAt: user.created_date,
          updatedAt: user.last_updated_date,
          isActive: user.is_active,
          userType: user.user_type?.user_type_name || 'N/A',
        }));
        setUsers(mappedUsers);
        setTotalUsers(data.total);
        setTotalPages(Math.ceil(data.total / 10));
      } else {
        if (response.status === 401) {
          router.push('/login');
        } else {
          setErrorUsers('Failed to fetch users');
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setErrorUsers('Error fetching users');
    } finally {
      setLoadingUsers(false);
    }
  }, [currentPage, router]);

  const fetchLogLevelCallback = useCallback(async (token: string) => {
    try {
      const response = await fetch('${process.env.NEXT_PUBLIC_API_BASE_URL}/api/logging/level', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLogLevel(data.logLevel);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching log level:', error);
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    if (activeTab === 'users') {
      fetchUsersCallback(token);
      fetchUserTypes(token);
    } else if (activeTab === 'roles') {
      fetchRoles(token);
    } else if (activeTab === 'modules') {
      fetchModulesUsers(token);
      fetchModules(token);
    } else if (activeTab === 'logs') {
      fetchLogLevelCallback(token);
      fetchLogs(token);
    }
  }, [router, activeTab, fetchUsersCallback, fetchLogLevelCallback]);


  const fetchUserTypes = async (token: string) => {
    try {
      const response = await fetch('${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user-types', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserTypes(data);
      }
    } catch (error) {
      console.error('Error fetching user types:', error);
    }
  };

  const fetchRoles = async (token: string) => {
    try {
      const response = await fetch('${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user-types', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      } else {
        setErrorRoles('Failed to fetch roles');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setErrorRoles('Error fetching roles');
    } finally {
      setLoadingRoles(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setSelectedUserId(null);
    setFormData({
      first_name: '',
      last_name: '',
      user_type_id: '',
      email: '',
      user_password: '',
      confirm_password: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      bank_name: '',
      bank_ifsc_code: '',
      bank_account_number: '',
      bank_address: '',
      is_active: true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = async (user: User) => {
    setModalMode('edit');
    setSelectedUserId(user.id);
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setFormData({
          first_name: userData.first_name,
          last_name: userData.last_name,
          user_type_id: userData.user_typeid.toString(),
          email: userData.email,
          user_password: '',
          confirm_password: '',
          phone: userData.phone || '',
          address: userData.address || '',
          city: userData.city || '',
          state: userData.state || '',
          bank_name: userData.bank_name || '',
          bank_ifsc_code: userData.bank_ifsc_code || '',
          bank_account_number: userData.bank_account_number || '',
          bank_address: userData.bank_address || '',
          is_active: userData.is_active,
        });
        setFormError('');
        setIsModalOpen(true);
      } else {
        setErrorUsers('Failed to load user data');
      }
    } catch {
      setErrorUsers('Error loading user data');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (modalMode === 'add' && formData.user_password !== formData.confirm_password) {
      setFormError('Passwords do not match');
      return;
    }
    if (modalMode === 'edit' && formData.user_password && formData.user_password !== formData.confirm_password) {
      setFormError('Passwords do not match');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    const submitData = modalMode === 'edit' && !formData.user_password
      ? (() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { user_password, confirm_password, ...rest } = formData;
          return rest;
        })()
      : { ...formData };
    try {
      const url = modalMode === 'add' ? '${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users' : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${selectedUserId}`;
      const method = modalMode === 'add' ? 'POST' : 'PUT';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });
      if (response.ok) {
        setIsModalOpen(false);
        fetchUsersCallback(token);
      } else {
        const errorData = await response.json();
        setFormError(errorData.message || `Failed to ${modalMode} user`);
      }
    } catch {
      setFormError(`Error ${modalMode === 'add' ? 'adding' : 'updating'} user`);
    }
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const email = user.email.toLowerCase();
    const query = appliedSearchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        fetchUsersCallback(token);
        if (users.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorRoles('');

    if (!roleFormData.user_type_name.trim()) {
      setErrorRoles('Role name is required');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const url = editingRole
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user-types/${editingRole.user_type_id}`
        : '${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user-types';
      const method = editingRole ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleFormData),
      });

      if (response.ok) {
        fetchRoles(token);
        setShowAddForm(false);
        setEditingRole(null);
        setRoleFormData({ user_type_name: '', is_active: true });
      } else {
        const errorData = await response.json();
        setErrorRoles(errorData.message || 'Failed to save role');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      setErrorRoles('Error saving role');
    }
  };

  const handleEditRole = (role: UserType) => {
    setEditingRole(role);
    setRoleFormData({
      user_type_name: role.user_type_name,
      is_active: role.is_active,
    });
    setShowAddForm(true);
  };

  const handleDeleteRole = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user-types/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        fetchRoles(token);
      } else {
        alert('Failed to delete role');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      alert('Error deleting role');
    }
  };

  const handleCancelRole = () => {
    setShowAddForm(false);
    setEditingRole(null);
    setRoleFormData({ user_type_name: '', is_active: true });
  };

  // Modules functions
  const fetchModulesUsers = async (token: string) => {
    try {
      const response = await fetch('${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const mappedUsers = data.users.map((user: ApiUser) => ({
          id: user.user_id.toString(),
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
        }));
        setModulesUsers(mappedUsers);
      } else {
        setErrorModules('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setErrorModules('Error fetching users');
    }
  };

  const fetchModules = async (token: string) => {
    try {
      const response = await fetch('${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin-modules', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setModules(data.map((m: ApiModule) => ({
          id: m.admin_module_id.toString(),
          name: m.module_name,
          category: m.category,
          url_slug: m.url_slug,
          is_active: m.is_active
        })));
      } else {
        setErrorModules('Failed to fetch modules');
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      setErrorModules('Error fetching modules');
    } finally {
      setLoadingModules(false);
    }
  };

  const handleUserChange = async (userId: string) => {
    setSelectedModuleUserId(userId);
    if (!userId) {
      setSelectedModuleIds([]);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${userId}/modules`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedModuleIds(data.modules.map((id: number) => id.toString()));
      } else {
        setErrorModules('Failed to fetch user modules');
      }
    } catch (error) {
      console.error('Error fetching user modules:', error);
      setErrorModules('Error fetching user modules');
    }
  };

  const handleModuleToggle = (moduleId: string) => {
    setSelectedModuleIds(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSave = async () => {
    if (!selectedModuleUserId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${selectedModuleUserId}/modules`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modules: selectedModuleIds.map(id => parseInt(id)) }),
      });
      if (response.ok) {
        alert('Modules updated successfully');
      } else {
        setErrorModules('Failed to update modules');
      }
    } catch (error) {
      console.error('Error updating modules:', error);
      setErrorModules('Error updating modules');
    }
  };

  const handleCancel = () => {
    setSelectedUserId('');
    setSelectedModuleIds([]);
  };

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorModules('');

    if (!moduleFormData.module_name.trim() || !moduleFormData.category.trim()) {
      setErrorModules('Module name and category are required');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const url = editingModule
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin-modules/${editingModule.id}`
        : '${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin-modules';
      const method = editingModule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moduleFormData),
      });

      if (response.ok) {
        fetchModules(token);
        setShowModuleForm(false);
        setEditingModule(null);
        setModuleFormData({ module_name: '', category: '', url_slug: '', is_active: true });
      } else {
        const errorData = await response.json();
        setErrorModules(errorData.message || 'Failed to save module');
      }
    } catch (error) {
      console.error('Error saving module:', error);
      setErrorModules('Error saving module');
    }
  };

  const handleModuleEdit = (module: Module) => {
    setEditingModule(module);
    setModuleFormData({
      module_name: module.name,
      category: module.category,
      url_slug: module.url_slug || '',
      is_active: module.is_active,
    });
    setShowModuleForm(true);
  };

  const handleModuleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this module?')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin-modules/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        fetchModules(token);
      } else {
        alert('Failed to delete module');
      }
    } catch (error) {
      console.error('Error deleting module:', error);
      alert('Error deleting module');
    }
  };

  const handleModuleCancel = () => {
    setShowModuleForm(false);
    setEditingModule(null);
    setModuleFormData({ module_name: '', category: '', url_slug: '', is_active: true });
  };

  // Logs functions

  const fetchLogs = async (token: string) => {
    try {
      const response = await fetch('${process.env.NEXT_PUBLIC_API_BASE_URL}/api/logging/logs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
      } else {
        setLogs('Failed to load logs');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs('Error loading logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleLogLevelChange = async (newLevel: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('${process.env.NEXT_PUBLIC_API_BASE_URL}/api/logging/level', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ level: newLevel }),
      });
      if (response.ok) {
        setLogLevel(newLevel);
        alert('Log level updated successfully');
      } else {
        alert('Failed to update log level');
      }
    } catch (error) {
      console.error('Error updating log level:', error);
      alert('Error updating log level');
    }
  };

  const handleRefreshLogs = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchLogs(token);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if ((activeTab === 'users' && loadingUsers) || (activeTab === 'roles' && loadingRoles) || (activeTab === 'modules' && loadingModules) || (activeTab === 'logs' && loadingLogs)) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-0">User and Role Management</h1>
        <Button onClick={handleLogout}>Logout</Button>
      </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              <Button
                variant={activeTab === 'users' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('users')}
                className="border-b-2"
              >
                Users
              </Button>
              <Button
                variant={activeTab === 'roles' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('roles')}
                className="border-b-2"
              >
                Roles
              </Button>
              <Button
                variant={activeTab === 'modules' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('modules')}
                className="border-b-2"
              >
                Manage Modules
              </Button>
              <Button
                variant={activeTab === 'logs' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('logs')}
                className="border-b-2"
              >
                Activity Logs
              </Button>
            </nav>
          </div>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 md:mb-0">Users</h2>
              <Button onClick={openAddModal}>Add User</Button>
            </div>
            {errorUsers && <div className="mb-4 text-red-600 bg-red-50 p-4 rounded">{errorUsers}</div>}
            <div className="mb-4">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search</label>
              <div className="mt-1 flex">
                <Input
                  type="text"
                  id="search"
                  placeholder="Search by name or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 rounded-r-none"
                />
                <Button onClick={() => setAppliedSearchQuery(searchQuery)} className="rounded-l-none">Search</Button>
              </div>
            </div>
            <UserTable users={filteredUsers} onEdit={openEditModal} onDelete={handleDeleteUser} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 mt-4">
                <div className="flex justify-between flex-1 sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span> ({totalUsers} total users)
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        if (page > totalPages) return null;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 md:mb-0">Roles</h2>
              <Button onClick={() => setShowAddForm(true)}>Add Role</Button>
            </div>
            {errorRoles && <div className="mb-4 text-red-600">{errorRoles}</div>}

            {showAddForm && (
              <div className="bg-white p-6 rounded shadow mb-6">
                <h3 className="text-xl font-semibold mb-4">
                  {editingRole ? 'Edit Role' : 'Add New Role'}
                </h3>
                <form onSubmit={handleRoleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role Name</label>
                      <Input
                        type="text"
                        required
                        value={roleFormData.user_type_name}
                        onChange={(e) => setRoleFormData({ ...roleFormData, user_type_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={roleFormData.is_active}
                          onChange={(e) => setRoleFormData({ ...roleFormData, is_active: e.target.checked })}
                          className="mr-2"
                        />
                        Is Active
                      </label>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-4">
                    <Button variant="outline" onClick={handleCancelRole}>Cancel</Button>
                    <Button type="submit">{editingRole ? 'Update' : 'Save'}</Button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {roles.map((role) => (
                      <tr key={role.user_type_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.user_type_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.is_active ? 'Active' : 'Inactive'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEditRole(role)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role.user_type_id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Manage Modules Tab */}
        {activeTab === 'modules' && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 md:mb-0">Manage Modules</h2>
              <Button onClick={() => setShowModuleForm(true)}>Add Module</Button>
            </div>
            {errorModules && <div className="mb-4 text-red-600 bg-red-50 p-4 rounded">{errorModules}</div>}

            {/* Module Management Form */}
            {showModuleForm && (
              <div className="bg-white p-6 rounded shadow mb-6">
                <h3 className="text-xl font-semibold mb-4">
                  {editingModule ? 'Edit Module' : 'Add New Module'}
                </h3>
                <form onSubmit={handleModuleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Module Name</label>
                      <Input
                        type="text"
                        required
                        value={moduleFormData.module_name}
                        onChange={(e) => setModuleFormData({ ...moduleFormData, module_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <Input
                        type="text"
                        required
                        value={moduleFormData.category}
                        onChange={(e) => setModuleFormData({ ...moduleFormData, category: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">URL Slug</label>
                      <Input
                        type="text"
                        value={moduleFormData.url_slug}
                        onChange={(e) => setModuleFormData({ ...moduleFormData, url_slug: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={moduleFormData.is_active}
                          onChange={(e) => setModuleFormData({ ...moduleFormData, is_active: e.target.checked })}
                          className="mr-2"
                        />
                        Is Active
                      </label>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-4">
                    <Button variant="outline" onClick={handleModuleCancel}>Cancel</Button>
                    <Button type="submit">{editingModule ? 'Update' : 'Save'}</Button>
                  </div>
                </form>
              </div>
            )}

            {/* Module List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL Slug</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {modules.map((module) => (
                      <tr key={module.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{module.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{module.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{module.url_slug}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{module.is_active ? 'Active' : 'Inactive'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleModuleEdit(module)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleModuleDelete(module.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User Module Assignment */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Assign Modules to Users</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
              <select
                value={selectedModuleUserId}
                onChange={(e) => handleUserChange(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select a user</option>
                {modulesUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            {selectedModuleUserId && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">Select Modules</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(modules.reduce((acc, module) => {
                    if (!acc[module.category]) acc[module.category] = [];
                    acc[module.category].push(module);
                    return acc;
                  }, {} as Record<string, Module[]>)).map(([category, mods]) => (
                    <div key={category}>
                      <h4 className="text-lg font-medium mb-2">{category}</h4>
                      <div className="space-y-2">
                        {mods.filter(m => m.is_active).map(module => (
                          <label key={module.id} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedModuleIds.includes(module.id)}
                              onChange={() => handleModuleToggle(module.id)}
                              className="mr-2"
                            />
                            {module.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedModuleUserId && (
              <div className="flex space-x-4">
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            )}
          </>
        )}

        {/* Activity Logs Tab */}
        {activeTab === 'logs' && (
          <>
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Log Level</h2>
              <div className="flex items-center space-x-4">
                <label htmlFor="logLevel" className="text-sm font-medium text-gray-700">Current Level:</label>
                <select
                  id="logLevel"
                  value={logLevel}
                  onChange={(e) => handleLogLevelChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="error">Error</option>
                  <option value="warn">Warn</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Logs</h2>
                <Button onClick={handleRefreshLogs}>Refresh Logs</Button>
              </div>
              <textarea
                value={logs}
                readOnly
                rows={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
              />
            </div>
          </>
        )}

    </>
  );
}