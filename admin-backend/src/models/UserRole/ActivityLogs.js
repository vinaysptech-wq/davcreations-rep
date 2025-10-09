const logger = require('../../utils/logger');

module.exports = (db) => ({
  createLog: async (level, message, userId = null, action = null, details = null) => {
    try {
      const log = await db.log.create({
        data: {
          level,
          message,
          user_id: userId,
          action,
          details,
        },
      });
      return log;
    } catch (error) {
      logger.error('Error in logsModel.createLog', {
        error: error.message,
        stack: error.stack,
        level,
        message,
        userId,
        action,
        details
      });
      throw error;
    }
  },

  getLogs: async (page = 1, limit = 50, level = null, userId = null, startDate = null, endDate = null) => {
    try {
      logger.debug('getLogs called with params:', { page, limit, level, userId, startDate, endDate });
      logger.debug('db.log exists:', !!db.log);
      logger.debug('db object keys:', Object.keys(db));
      const where = {};
      if (level) where.level = level;
      if (userId) where.user_id = userId;
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }
      logger.debug('Where clause:', where);

      const total = await db.log.count({ where });
      const logs = await db.log.findMany({
        where,
        include: {
          user: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      // Map log_id to id for frontend compatibility
      const mappedLogs = logs.map(log => ({
        id: log.log_id,
        timestamp: log.timestamp,
        level: log.level,
        message: log.message,
        user_id: log.user_id,
        action: log.action,
        details: log.details,
        user: log.user,
      }));

      return { logs: mappedLogs, total, page, limit };
    } catch (error) {
      logger.error('Error in logsModel.getLogs', {
        error: error.message,
        stack: error.stack,
        page,
        limit,
        level,
        userId,
        startDate,
        endDate
      });
      throw error;
    }
  },
});