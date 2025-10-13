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

export interface Role {
  user_type_id: number;
  user_type_name: string;
  created_date: string;
  last_updated_date: string;
  is_active: boolean;
}

export interface Module {
  admin_module_id: number;
  module_name: string;
  parent_id?: number;
  tool_tip?: string;
  short_description?: string;
  url_slug?: string;
  user_id?: number;
  category?: string;
  created_date: string;
  last_updated_date: string;
  is_active: boolean;
  parent?: Module;
  children?: Module[];
}

export interface Permission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface RolePermission {
  role_permissions_id: number;
  user_type_id: number;
  admin_module_id: number;
  permissions: Permission;
  created_date: string;
  last_updated_date: string;
  is_active: boolean;
  user_type: Role;
  admin_module: Module;
}

export interface PermissionAudit {
  audit_id: number;
  role_permissions_id: number;
  user_id: number;
  action: 'create' | 'update' | 'delete';
  old_permissions?: Permission;
  new_permissions?: Permission;
  change_reason?: string;
  ip_address?: string;
  user_agent?: string;
  created_date: string;
  role_permission: RolePermission;
  user: User;
}

export interface UserPermission extends RolePermission {
  source: 'role' | 'user' | 'inherited';
  effective_permissions: Permission;
}