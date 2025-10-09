import { UserForm } from '@/features/UserRole/AdminUsers';

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UserForm mode="edit" userId={id} />;
}