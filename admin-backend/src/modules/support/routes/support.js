module.exports = (controller, logger) => {
  const express = require('express');
  const { authenticateToken } = require('../../../middleware/auth');

  const router = express.Router();

  // Middleware to log incoming requests
  router.use((req, res, next) => {
    logger.debug(`Incoming support request: ${req.method} ${req.path}`);
    next();
  });

  // All routes require authentication
  router.use(authenticateToken);

  router.post('/tickets', (req, res, next) => {
    logger.info('Processing create ticket request');
    next();
  }, controller.createTicket);

  router.get('/tickets', (req, res, next) => {
    logger.info('Processing get tickets request');
    next();
  }, controller.getTickets);

  router.get('/tickets/:id', (req, res, next) => {
    logger.info('Processing get ticket request');
    next();
  }, controller.getTicket);

  router.put('/tickets/:id', (req, res, next) => {
    logger.info('Processing update ticket request');
    next();
  }, controller.updateTicket);

  return router;
};