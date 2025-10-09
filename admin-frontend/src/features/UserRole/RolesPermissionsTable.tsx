import { User } from './types';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import Button from '@/components/ui/button/Button';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
}

export default function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  return (
    <Table className="bg-white shadow overflow-hidden sm:rounded-md">
      <TableHeader className="bg-gray-50">
        <TableRow>
          <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Checkbox</TableCell>
          <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</TableCell>
          <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</TableCell>
          <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</TableCell>
          <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Type</TableCell>
          <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableCell>
          <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody className="bg-white divide-y divide-gray-200">
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="px-6 py-4 whitespace-nowrap">
              <input type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
            </TableCell>
            <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</TableCell>
            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</TableCell>
            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone}</TableCell>
            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.userType}</TableCell>
            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.isActive ? 'Active' : 'Inactive'}</TableCell>
            <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <Button variant="outline" size="sm" onClick={() => onEdit(user)} className="mr-2">View/Edit</Button>
              <Button variant="outline" size="sm" onClick={() => onDelete(user.id)}>Delete</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}