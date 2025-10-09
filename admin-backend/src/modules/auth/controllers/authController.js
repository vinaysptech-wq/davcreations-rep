module.exports = (service, logger) => ({
  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      logger.warn('Login failed: missing credentials');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    logger.debug(`Login attempt for email: ${email}`);

    try {
      const result = await service.login(email, password);
      logger.info(`Login successful for user: ${email}`);
      console.log('DEBUG: authController.login about to send response with status 200');
      res.json(result);
    } catch (error) {
      logger.error(`Login failed for email: ${email}, error: ${error.message}`);
      res.status(401).json({ message: error.message });
    }
  },
});