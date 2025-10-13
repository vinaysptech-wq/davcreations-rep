module.exports = (service, rolePermissionsService, logger) => ({
  getUserTypes: async (req, res) => {
    logger.debug('Starting getUserTypes');
    try {
      const userTypes = await service.getAll();
      logger.info('getUserTypes completed successfully');
      res.json(userTypes);
    } catch (error) {
      logger.error('Error in getUserTypes:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  getUserType: async (req, res) => {
    logger.debug('Starting getUserType');
    try {
      const { id } = req.params;
      const userType = await service.getById(id);
      if (!userType) {
        logger.info('User type not found for getUserType');
        return res.status(404).json({ message: 'User type not found' });
      }
      logger.info('getUserType completed successfully');
      res.json(userType);
    } catch (error) {
      logger.error('Error in getUserType:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  createUserType: async (req, res) => {
    logger.debug('Starting createUserType');
    try {
      const Joi = require('joi');
      const createUserTypeSchema = Joi.object({
        user_type_name: Joi.string().trim().required().min(1),
        is_active: Joi.boolean().optional(),
      });

      const { error } = createUserTypeSchema.validate(req.body);
      if (error) {
        logger.info('Validation error in createUserType:', error.details[0].message);
        return res.status(400).json({ message: error.details[0].message });
      }
      const userTypeData = req.body;
      const userType = await service.create(userTypeData);
      logger.info(`AUDIT: User type created with ID ${userType.user_type_id} by user ${req.user.user_id}`);
      logger.info(`User type created successfully with ID: ${userType.user_type_id}`);
      res.status(201).json(userType);
    } catch (error) {
      logger.error('Error in createUserType:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  updateUserType: async (req, res) => {
    logger.debug('Starting updateUserType');
    logger.debug('Request body:', JSON.stringify(req.body));
    try {
      const Joi = require('joi');
      const updateUserTypeSchema = Joi.object({
        user_type_name: Joi.string().trim().required().min(1),
        is_active: Joi.boolean().optional(),
      });

      const { error } = updateUserTypeSchema.validate(req.body);
      if (error) {
        logger.info('Validation error in updateUserType:', error.details[0].message);
        return res.status(400).json({ message: error.details[0].message });
      }
      const { id } = req.params;
      const userTypeData = req.body;
      const userType = await service.update(id, userTypeData);
      if (!userType) {
        logger.info('User type not found for updateUserType');
        return res.status(404).json({ message: 'User type not found' });
      }
      logger.info(`AUDIT: User type updated with ID ${id} by user ${req.user.user_id}`);
      logger.info('updateUserType completed successfully');
      res.json(userType);
    } catch (error) {
      logger.error('Error in updateUserType:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  deleteUserType: async (req, res) => {
    logger.debug('Starting deleteUserType');
    try {
      const { id } = req.params;
      await service.delete(id);
      logger.info('deleteUserType completed successfully');
      res.json({ message: 'User type deleted successfully' });
    } catch (error) {
      logger.error('Error in deleteUserType:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  getPermissionsForRole: async (req, res) => {
    logger.debug('Starting getPermissionsForRole');
    try {
      const { id } = req.params;
      const permissions = await rolePermissionsService.getPermissionsByRoleId(id);
      logger.info('getPermissionsForRole completed successfully');
      res.json(permissions);
    } catch (error) {
      logger.error('Error in getPermissionsForRole:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  assignPermissionToRole: async (req, res) => {
    logger.debug('Starting assignPermissionToRole');
    try {
      const Joi = require('joi');
      const assignPermissionSchema = Joi.object({
        moduleId: Joi.number().integer().required(),
        permissions: Joi.object({
          view: Joi.boolean().optional(),
          create: Joi.boolean().optional(),
          edit: Joi.boolean().optional(),
          delete: Joi.boolean().optional(),
        }).optional(),
        changeReason: Joi.string().optional(),
      });

      const { error } = assignPermissionSchema.validate(req.body);
      if (error) {
        logger.info('Validation error in assignPermissionToRole:', error.details[0].message);
        return res.status(400).json({ message: error.details[0].message });
      }

      const { id } = req.params;
      const { moduleId, permissions, changeReason } = req.body;
      const permission = await rolePermissionsService.assignPermissionToRole(
        id,
        moduleId,
        permissions,
        req.user.user_id,
        changeReason,
        req
      );
      logger.info(`AUDIT: Permission assigned to role ${id} for module ${moduleId} by user ${req.user.user_id}`);
      logger.info('assignPermissionToRole completed successfully');
      res.status(201).json(permission);
    } catch (error) {
      logger.error('Error in assignPermissionToRole:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  removePermissionFromRole: async (req, res) => {
    logger.debug('Starting removePermissionFromRole');
    try {
      const { id, moduleId } = req.params;
      await rolePermissionsService.removePermissionFromRole(id, moduleId);
      logger.info(`AUDIT: Permission removed from role ${id} for module ${moduleId} by user ${req.user.user_id}`);
      logger.info('removePermissionFromRole completed successfully');
      res.json({ message: 'Permission removed successfully' });
    } catch (error) {
      logger.error('Error in removePermissionFromRole:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  bulkAssignPermissions: async (req, res) => {
    logger.debug('Starting bulkAssignPermissions');
    try {
      const Joi = require('joi');
      const bulkAssignSchema = Joi.object({
        moduleIds: Joi.array().items(Joi.number().integer()).min(1).required(),
      });

      const { error } = bulkAssignSchema.validate(req.body);
      if (error) {
        logger.info('Validation error in bulkAssignPermissions:', error.details[0].message);
        return res.status(400).json({ message: error.details[0].message });
      }

      const { id } = req.params;
      const { moduleIds } = req.body;
      const results = await rolePermissionsService.bulkAssignPermissions(id, moduleIds);
      logger.info(`AUDIT: Bulk permissions assigned to role ${id} by user ${req.user.user_id}`);
      logger.info('bulkAssignPermissions completed successfully');
      res.status(201).json(results);
    } catch (error) {
      logger.error('Error in bulkAssignPermissions:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  bulkRemovePermissions: async (req, res) => {
    logger.debug('Starting bulkRemovePermissions');
    try {
      const Joi = require('joi');
      const bulkRemoveSchema = Joi.object({
        moduleIds: Joi.array().items(Joi.number().integer()).min(1).required(),
      });

      const { error } = bulkRemoveSchema.validate(req.body);
      if (error) {
        logger.info('Validation error in bulkRemovePermissions:', error.details[0].message);
        return res.status(400).json({ message: error.details[0].message });
      }

      const { id } = req.params;
      const { moduleIds } = req.body;
      const results = await rolePermissionsService.bulkRemovePermissions(id, moduleIds);
      logger.info(`AUDIT: Bulk permissions removed from role ${id} by user ${req.user.user_id}`);
      logger.info('bulkRemovePermissions completed successfully');
      res.json(results);
    } catch (error) {
      logger.error('Error in bulkRemovePermissions:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  updateRolePermissions: async (req, res) => {
    logger.debug('Starting updateRolePermissions');
    try {
      const Joi = require('joi');
      const updatePermissionsSchema = Joi.object({
        moduleId: Joi.number().integer().required(),
        permissions: Joi.object({
          view: Joi.boolean().required(),
          create: Joi.boolean().required(),
          edit: Joi.boolean().required(),
          delete: Joi.boolean().required(),
        }).required(),
        changeReason: Joi.string().optional(),
      });

      const { error } = updatePermissionsSchema.validate(req.body);
      if (error) {
        logger.info('Validation error in updateRolePermissions:', error.details[0].message);
        return res.status(400).json({ message: error.details[0].message });
      }

      const { id } = req.params;
      const { moduleId, permissions, changeReason } = req.body;
      const result = await rolePermissionsService.updateRolePermissions(
        id,
        moduleId,
        permissions,
        req.user.user_id,
        changeReason,
        req
      );
      logger.info(`AUDIT: Role permissions updated for role ${id}, module ${moduleId} by user ${req.user.user_id}`);
      logger.info('updateRolePermissions completed successfully');
      res.json(result);
    } catch (error) {
      logger.error('Error in updateRolePermissions:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  bulkUpdateRolePermissions: async (req, res) => {
    logger.debug('Starting bulkUpdateRolePermissions');
    try {
      const Joi = require('joi');
      const bulkUpdateSchema = Joi.object({
        updates: Joi.array().items(Joi.object({
          roleId: Joi.number().integer().required(),
          moduleId: Joi.number().integer().required(),
          permissions: Joi.object({
            view: Joi.boolean().required(),
            create: Joi.boolean().required(),
            edit: Joi.boolean().required(),
            delete: Joi.boolean().required(),
          }).required(),
        })).min(1).required(),
        changeReason: Joi.string().optional(),
      });

      const { error } = bulkUpdateSchema.validate(req.body);
      if (error) {
        logger.info('Validation error in bulkUpdateRolePermissions:', error.details[0].message);
        return res.status(400).json({ message: error.details[0].message });
      }

      const { updates, changeReason } = req.body;
      const results = await rolePermissionsService.bulkUpdateRolePermissions(
        updates,
        req.user.user_id,
        changeReason,
        req
      );
      logger.info(`AUDIT: Bulk role permissions updated by user ${req.user.user_id}`);
      logger.info('bulkUpdateRolePermissions completed successfully');
      res.json(results);
    } catch (error) {
      logger.error('Error in bulkUpdateRolePermissions:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  getPermissionAuditLogs: async (req, res) => {
    logger.debug('Starting getPermissionAuditLogs');
    try {
      const { rolePermissionsId } = req.params;
      const { limit } = req.query;
      const auditLogs = await rolePermissionsService.getPermissionAuditLogs(rolePermissionsId, limit);
      logger.info('getPermissionAuditLogs completed successfully');
      res.json(auditLogs);
    } catch (error) {
      logger.error('Error in getPermissionAuditLogs:', error.message);
      res.status(500).json({ message: error.message });
    }
  },
});