module.exports = (controller, logger) => {
  const express = require('express');

  const router = express.Router();

  // Middleware to log incoming requests
  router.use((req, res, next) => {
    logger.debug(`Incoming request: ${req.method} ${req.path}`);
    next();
  });

  router.post('/login', (req, res, next) => {
    logger.info('Processing login request');
    next();
  }, controller.login);

  return router;
};