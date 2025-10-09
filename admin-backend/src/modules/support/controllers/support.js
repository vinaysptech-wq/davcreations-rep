module.exports = (service, logger, loggingService) => ({
  createTicket: async (req, res) => {
    logger.debug('Starting createTicket');
    try {
      const ticketData = req.body;
      ticketData.user_id = req.user.user_id;
      const ticket = await service.createTicket(req.user.user_id, ticketData);
      logger.info(`AUDIT: Support ticket created with ID ${ticket.ticket_id} by user ${req.user.user_id}`);

      // Log to DB
      if (req.user.user_type_name === 'Superadmin') {
        await loggingService.createLog('info', `Support ticket created ${ticket.ticket_id}`, req.user.user_id, 'TICKET_CREATE', JSON.stringify({ ticket_id: ticket.ticket_id }));
      }

      logger.info('createTicket completed successfully');
      res.status(201).json(ticket);
    } catch (error) {
      logger.error('Error in createTicket:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  getTickets: async (req, res) => {
    logger.debug('Starting getTickets');
    try {
      const { page = 1, limit = 10 } = req.query;
      const isAdmin = req.user.user_type_name === 'Superadmin';
      const { tickets, total } = await service.getTickets(req.user.user_id, isAdmin, page, limit);
      logger.info('getTickets completed successfully');
      res.json({ tickets, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
      logger.error('Error in getTickets:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  getTicket: async (req, res) => {
    logger.debug('Starting getTicket');
    try {
      const { id } = req.params;
      const ticket = await service.getTicketById(id, req.user.user_id, req.user.user_type_name === 'Superadmin');

      if (!ticket) {
        logger.info('Ticket not found for getTicket');
        return res.status(404).json({ message: 'Ticket not found' });
      }

      logger.info('getTicket completed successfully');
      res.json(ticket);
    } catch (error) {
      logger.error('Error in getTicket:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  updateTicket: async (req, res) => {
    logger.debug('Starting updateTicket');
    try {
      const { id } = req.params;
      const updateData = req.body;
      const ticket = await service.updateTicket(id, updateData, req.user.user_id, req.user.user_type_name === 'Superadmin');
      logger.info(`AUDIT: Support ticket updated with ID ${id} by user ${req.user.user_id}`);

      // Log to DB
      if (req.user.user_type_name === 'Superadmin') {
        await loggingService.createLog('info', `Support ticket updated ${id}`, req.user.user_id, 'TICKET_UPDATE', JSON.stringify({ ticket_id: id, updates: updateData }));
      }

      logger.info('updateTicket completed successfully');
      res.json(ticket);
    } catch (error) {
      logger.error('Error in updateTicket:', error.message);
      res.status(500).json({ message: error.message });
    }
  },
});