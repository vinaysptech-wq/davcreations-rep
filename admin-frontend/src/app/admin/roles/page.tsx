'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Button from '../../../components/ui/button/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../components/ui/table';
import Input from '../../../components/form/input/InputField';

interface UserType {
  user_type_id: number;
  user_type_name: string;
  is_active: boolean;
}

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRole, setEditingRole] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    user_type_name: '',
    is_active: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchRoles(token);
  }, [router]);

  const fetchRoles = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user-types`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      } else {
        setError('Failed to fetch roles');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setError('Error fetching roles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.user_type_name.trim()) {
      setError('Role name is required');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const url = editingRole
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user-types/${editingRole.user_type_id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user-types`;
      const method = editingRole ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchRoles(token);
        setShowAddForm(false);
        setEditingRole(null);
        setFormData({ user_type_name: '', is_active: true });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save role');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      setError('Error saving role');
    }
  };

  const handleEdit = (role: UserType) => {
    setEditingRole(role);
    setFormData({
      user_type_name: role.user_type_name,
      is_active: role.is_active,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
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

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingRole(null);
    setFormData({ user_type_name: '', is_active: true });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Roles And Permissions</h1>
        <Button onClick={() => setShowAddForm(true)}>Add Role</Button>
      </div>
        {error && <div className="mb-4 text-red-600">{error}</div>}

        {showAddForm && (
          <div className="bg-white p-6 rounded shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingRole ? 'Edit Role' : 'Add New Role'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role Name</label>
                  <Input
                    type="text"
                    required
                    value={formData.user_type_name}
                    onChange={(e) => setFormData({ ...formData, user_type_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="mr-2"
                    />
                    Is Active
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-4">
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button type="submit">{editingRole ? 'Update' : 'Save'}</Button>
              </div>
            </form>
          </div>
        )}

        <Table className="bg-white shadow overflow-hidden sm:rounded-md">
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-gray-200">
            {roles.map((role) => (
              <TableRow key={role.user_type_id}>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.user_type_name}</TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.is_active ? 'Active' : 'Inactive'}</TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(role)} className="mr-2">Edit</Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(role.user_type_id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </>
  );
}