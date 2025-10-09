module.exports = (config, logger, model) => ({
  createTicket: async (userId, ticketData) => {
    logger.debug(`Creating support ticket for user ${userId}`);

    if (!ticketData.subject || !ticketData.description) {
      throw new Error('Subject and description are required');
    }

    const data = {
      user_id: userId,
      subject: ticketData.subject,
      description: ticketData.description,
      priority: ticketData.priority || 'medium',
      status: 'open'
    };

    try {
      const ticket = await model.createSupportTicket(data);
      logger.info(`Support ticket created successfully: ${ticket.ticket_id}`);
      return ticket;
    } catch (error) {
      logger.error('Error in supportService.createTicket', {
        error: error.message,
        stack: error.stack,
        userId,
        ticketData
      });
      throw error;
    }
  },

  getTickets: async (userId, isAdmin, page = 1, limit = 10, additionalWhere = {}) => {
    logger.debug(`Getting support tickets for user ${userId}, isAdmin: ${isAdmin}`);

    const where = isAdmin ? { ...additionalWhere } : { user_id: userId, ...additionalWhere };

    try {
      const result = await model.getSupportTickets(where, page, limit);
      logger.info(`Retrieved ${result.tickets.length} support tickets`);
      return result;
    } catch (error) {
      logger.error('Error in supportService.getTickets', {
        error: error.message,
        stack: error.stack,
        userId,
        isAdmin
      });
      throw error;
    }
  },

  getTicketById: async (ticketId, userId, isAdmin) => {
    logger.debug(`Getting support ticket ${ticketId} for user ${userId}, isAdmin: ${isAdmin}`);

    try {
      const ticket = await model.getSupportTicketById(ticketId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      if (!isAdmin && ticket.user_id !== userId) {
        throw new Error('Access denied');
      }

      logger.info(`Retrieved support ticket: ${ticketId}`);
      return ticket;
    } catch (error) {
      logger.error('Error in supportService.getTicketById', {
        error: error.message,
        stack: error.stack,
        ticketId,
        userId,
        isAdmin
      });
      throw error;
    }
  },

  updateTicket: async (ticketId, updateData, userId, isAdmin) => {
    logger.debug(`Updating support ticket ${ticketId} by user ${userId}, isAdmin: ${isAdmin}`);

    try {
      const ticket = await model.getSupportTicketById(ticketId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      if (!isAdmin && ticket.user_id !== userId) {
        throw new Error('Access denied');
      }

      const allowedFields = isAdmin ? ['subject', 'description', 'priority', 'status'] : ['subject', 'description', 'priority'];
      const data = {};

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          data[field] = updateData[field];
        }
      });

      if (Object.keys(data).length === 0) {
        throw new Error('No valid fields to update');
      }

      data.updated_at = new Date();

      const updatedTicket = await model.updateSupportTicket(ticketId, data);
      logger.info(`Support ticket updated successfully: ${ticketId}`);
      return updatedTicket;
    } catch (error) {
      logger.error('Error in supportService.updateTicket', {
        error: error.message,
        stack: error.stack,
        ticketId,
        updateData,
        userId,
        isAdmin
      });
      throw error;
    }
  }
});