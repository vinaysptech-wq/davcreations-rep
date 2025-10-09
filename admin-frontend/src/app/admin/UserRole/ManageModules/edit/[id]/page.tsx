import { AdminModuleForm } from '@/features/UserRole/ManageModules';

export default async function EditModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminModuleForm mode="edit" moduleId={id} />;
}