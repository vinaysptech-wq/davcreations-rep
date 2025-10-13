const { logger } = require('../utils');

class PermissionResolutionService {
  constructor(prisma, cache = new Map()) {
    this.prisma = prisma;
    this.cache = cache; // Simple in-memory cache, can be replaced with Redis
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get effective permissions for a user, combining role and user-specific permissions
   * @param {number} userId - User ID
   * @param {number} userTypeId - User type ID (role)
   * @returns {Promise<Object>} Object with module permissions including granular actions
   */
  async getEffectivePermissions(userId, userTypeId) {
    const cacheKey = `permissions:${userId}:${userTypeId}`;

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      logger.debug(`Returning cached permissions for user ${userId}`);
      return cached;
    }

    try {
      logger.debug(`Calculating effective permissions for user ${userId}, role ${userTypeId}`);

      // Get role permissions
      const rolePermissions = await this.getRolePermissions(userTypeId);

      // Get user-specific permissions
      const userPermissions = await this.getUserPermissions(userId);

      // Combine permissions with inheritance logic
      const effectivePermissions = this.combinePermissions(rolePermissions, userPermissions);

      // Cache the result
      this.setCache(cacheKey, effectivePermissions);

      logger.info(`Effective permissions calculated for user ${userId}: ${effectivePermissions.length} modules`);
      return effectivePermissions;

    } catch (error) {
      logger.error('Error calculating effective permissions', {
        error: error.message,
        userId,
        userTypeId
      });
      throw error;
    }
  }

  /**
   * Get permissions assigned to a role
   * @param {number} userTypeId - User type ID
   * @returns {Promise<Array<Object>>} Array of permission objects with module details
   */
  async getRolePermissions(userTypeId) {
    const permissions = await this.prisma.rolePermissions.findMany({
      where: {
        user_type_id: parseInt(userTypeId),
        is_active: true,
      },
      include: {
        admin_module: {
          include: {
            parent: true,
            children: true,
          },
        },
      },
    });

    return permissions;
  }

  /**
   * Get user-specific permissions
   * @param {number} userId - User ID
   * @returns {Promise<Array<Object>>} Array of permission objects with module details
   */
  async getUserPermissions(userId) {
    const permissions = await this.prisma.userAccess.findMany({
      where: {
        user_id: parseInt(userId),
        is_active: true,
      },
      include: {
        admin_module: {
          include: {
            parent: true,
            children: true,
          },
        },
      },
    });

    return permissions;
  }

  /**
   * Combine role and user permissions with inheritance logic
   * User permissions override role permissions for specific modules
   * Parent module access grants access to all children
   * @param {Array<Object>} rolePermissions - Role permissions
   * @param {Array<Object>} userPermissions - User-specific permissions
   * @returns {Object} Object with module permissions and granular actions
   */
  combinePermissions(rolePermissions, userPermissions) {
    const modulePermissions = {};

    // Add role permissions
    for (const perm of rolePermissions) {
      const moduleId = perm.admin_module_id;
      modulePermissions[moduleId] = {
        permissions: perm.permissions || { view: true, create: false, edit: false, delete: false },
        source: 'role',
        module: perm.admin_module,
      };
    }

    // Add/override with user permissions (user permissions take precedence)
    for (const perm of userPermissions) {
      const moduleId = perm.admin_module_id;
      // For user permissions, assume full access if no specific permissions defined
      modulePermissions[moduleId] = {
        permissions: perm.permissions || { view: true, create: true, edit: true, delete: true },
        source: 'user',
        module: perm.admin_module,
      };
    }

    // Apply parent module inheritance
    const finalPermissions = {};

    for (const [moduleId, permData] of Object.entries(modulePermissions)) {
      const moduleIdNum = parseInt(moduleId);

      // Add the module itself with its permissions
      finalPermissions[moduleIdNum] = {
        ...permData.permissions,
        module: permData.module,
        source: permData.source,
      };

      // If this is a parent module, inherit permissions to children
      if (permData.module.children && permData.module.children.length > 0) {
        this.inheritPermissionsToChildren(permData.module.children, permData.permissions, finalPermissions, permData.source);
      }

      // If this module has a parent, ensure parent has at least view access (inheritance up)
      if (permData.module.parent_id && !finalPermissions[permData.module.parent_id]) {
        finalPermissions[permData.module.parent_id] = {
          view: true,
          create: false,
          edit: false,
          delete: false,
          module: permData.module.parent,
          source: 'inherited',
        };
      }
    }

    return finalPermissions;
  }

  /**
   * Recursively inherit permissions to child modules
   * @param {Array<Object>} children - Child modules
   * @param {Object} parentPermissions - Parent permissions to inherit
   * @param {Object} finalPermissions - Final permissions object
   * @param {string} source - Source of permissions
   */
  inheritPermissionsToChildren(children, parentPermissions, finalPermissions, source) {
    for (const child of children) {
      const childId = child.admin_module_id;
      if (!finalPermissions[childId]) {
        // Inherit parent permissions to child, but child can only have equal or lesser permissions
        finalPermissions[childId] = {
          view: parentPermissions.view,
          create: parentPermissions.create && parentPermissions.view, // Create requires view
          edit: parentPermissions.edit && parentPermissions.view, // Edit requires view
          delete: parentPermissions.delete && parentPermissions.view, // Delete requires view
          module: child,
          source: 'inherited',
        };
      }

      if (child.children && child.children.length > 0) {
        this.inheritPermissionsToChildren(child.children, parentPermissions, finalPermissions, source);
      }
    }
  }

  /**
   * Check if user has access to a specific module
   * @param {number} userId - User ID
   * @param {number} userTypeId - User type ID
   * @param {number} moduleId - Module ID to check
   * @returns {Promise<boolean>} True if user has access
   */
  async hasModuleAccess(userId, userTypeId, moduleId) {
    const effectivePermissions = await this.getEffectivePermissions(userId, userTypeId);
    return effectivePermissions[parseInt(moduleId)] && effectivePermissions[parseInt(moduleId)].view === true;
  }

  /**
   * Check if user has specific permission for a module
   * @param {number} userId - User ID
   * @param {number} userTypeId - User type ID
   * @param {number} moduleId - Module ID to check
   * @param {string} action - Action to check (view, create, edit, delete)
   * @returns {Promise<boolean>} True if user has the specific permission
   */
  async hasPermission(userId, userTypeId, moduleId, action) {
    const effectivePermissions = await this.getEffectivePermissions(userId, userTypeId);
    const modulePerms = effectivePermissions[parseInt(moduleId)];
    return modulePerms && modulePerms[action] === true;
  }

  /**
   * Get detailed permission breakdown for a user
   * @param {number} userId - User ID
   * @param {number} userTypeId - User type ID
   * @returns {Promise<Object>} Detailed permission information
   */
  async getPermissionDetails(userId, userTypeId) {
    const rolePermissions = await this.getRolePermissions(userTypeId);
    const userPermissions = await this.getUserPermissions(userId);
    const effectivePermissions = await this.getEffectivePermissions(userId, userTypeId);

    return {
      userId,
      userTypeId,
      rolePermissions: rolePermissions.map(p => ({
        moduleId: p.admin_module_id,
        moduleName: p.admin_module.module_name,
        parentId: p.admin_module.parent_id,
        permissions: p.permissions,
      })),
      userPermissions: userPermissions.map(p => ({
        moduleId: p.admin_module_id,
        moduleName: p.admin_module.module_name,
        parentId: p.admin_module.parent_id,
        permissions: p.permissions,
      })),
      effectivePermissions,
      totalEffectiveModules: Object.keys(effectivePermissions).length,
    };
  }

  /**
   * Clear cache for a specific user
   * @param {number} userId - User ID
   */
  clearUserCache(userId) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`permissions:${userId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
    logger.debug(`Cleared cache for user ${userId}`);
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.cache.clear();
    logger.debug('Cleared all permission cache');
  }

  /**
   * Get value from cache with TTL check
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key); // Remove expired entry
    }
    return null;
  }

  /**
   * Set value in cache with timestamp
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}

module.exports = PermissionResolutionService;