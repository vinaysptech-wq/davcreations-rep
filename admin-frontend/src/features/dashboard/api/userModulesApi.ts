import { usersApi, adminModulesApi } from '@/apis';

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

export async function fetchUserModules(userId: number): Promise<Module[]> {
  try {
    const userModulesResponse = await usersApi.getUserModules(userId.toString());
    const allModulesResponse = await adminModulesApi.getAdminModules();

    const userModuleIds = (userModulesResponse.data as { modules: number[] }).modules;
    const allModules = allModulesResponse.data as ApiModule[];

    const userMods = allModules.filter((m) => userModuleIds.includes(m.admin_module_id)).map((m) => ({
      id: m.admin_module_id.toString(),
      name: m.module_name,
      category: m.category,
      url_slug: m.url_slug,
      is_active: m.is_active
    }));
    return userMods;
  } catch (error) {
    console.error('Error fetching user modules:', error);
    return [];
  }
}