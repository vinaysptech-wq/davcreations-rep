require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

// Load config, logger, db
let config, logger, db, setup;
try {
  config = require('./config');
  logger = require('./utils/logger');
  db = require('./lib/prisma');
  setup = require('./utils/setup');
} catch (error) {
  console.error('CRITICAL: Failed to load configuration or dependencies:', error.message);
  process.exit(1);
}

const app = express();

// Log configuration values for debugging (only in non-test environments)
if (process.env.NODE_ENV !== 'test') {
  logger.info(`Server config loaded - Port: ${config.server.port}, Env: ${config.server.env}`);
  logger.info(`SSL Config - HTTPS Enabled: ${config.server.httpsEnabled}, HTTPS Redirect: ${config.server.httpsRedirect}`);
  logger.info(`CORS Config - Origin: ${config.server.corsOrigin}, Credentials: ${config.server.corsCredentials}`);
}

// Middleware
if (process.env.NODE_ENV !== 'test') {
  logger.info(`CORS configured with origin: ${config.server.corsOrigin}`);
}
app.use(cors({
  origin: config.server.corsOrigin,
  credentials: config.server.corsCredentials,
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Time']
}));

// HTTPS enforcement middleware for production
if (config.server.env === 'production') {
  if (config.server.httpsEnabled && config.server.httpsRedirect) {
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https') {
        logger.warn(`SECURITY: HTTP request redirected to HTTPS for ${req.method} ${req.path} from ${req.ip}`);
        res.redirect(`https://${req.header('host')}${req.url}`);
      } else {
        next();
      }
    });
    logger.info('SSL CONFIG: HTTPS enforcement enabled for production');
  } else {
    logger.warn('SSL CONFIG: HTTPS enforcement disabled in production - ensure SSL termination is handled by reverse proxy');
  }
} else {
  logger.info('SSL CONFIG: HTTPS enforcement skipped in development environment');
}

if (config.server.env === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json());
app.use(express.static('../frontend'));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV !== 'production' ? 1000 : 100, // limit each IP to 1000 requests per windowMs in development, 100 in production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`SECURITY AUDIT: Rate limit exceeded for IP: ${req.ip}, path: ${req.path}, user-agent: ${req.get('User-Agent')}, total requests in window: ${req.rateLimit?.current || 'unknown'}`);
    res.status(429).json({ message: 'Too many requests, please try again later.' });
  }
});
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit login attempts to 5 per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`SECURITY AUDIT: Login rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ message: 'Too many login attempts, please try again later.' });
  }
}));
app.use(limiter);

// SECURITY AUDIT: Log security headers
app.use((req, res, next) => {
  logger.debug(`SECURITY HEADERS CHECK: ${req.method} ${req.path} - Content-Type: ${req.headers['content-type']}, Authorization: ${req.headers.authorization ? 'present' : 'missing'}`);
  next();
});

// SECURITY AUDIT: Check for security headers on response
app.use((req, res, next) => {
  res.on('finish', () => {
    const securityHeaders = ['x-content-type-options', 'x-frame-options', 'x-xss-protection', 'strict-transport-security'];
    const missingHeaders = securityHeaders.filter(header => !res.get(header));
    if (missingHeaders.length > 0) {
      logger.warn(`SECURITY WARNING: Missing security headers on ${req.method} ${req.path}: ${missingHeaders.join(', ')}`);
    }
  });
  next();
});

// Load modules dynamically
const fs = require('fs');
const path = require('path');
const modulesDir = path.join(__dirname, 'modules');
const moduleNames = fs.readdirSync(modulesDir).filter(file => {
  const fullPath = path.join(modulesDir, file);
  return fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'index.js'));
});
const routers = {};
moduleNames.forEach(moduleName => {
  const router = require(`./modules/${moduleName}`)(config, logger, db);
  routers[moduleName] = router;
});

// Routes
app.use('/api/auth', routers.auth);
app.use('/api/users', routers.users);
app.use('/api/logging', routers.logging);
app.use('/api/userTypes', routers.userTypes);
app.use('/api/admin-modules', routers.adminModules);
app.use('/api/support', routers.support);

// Global error handling middleware
app.use((err, req, res, next) => {
  // Log the error with details
  logger.error('Unhandled error occurred', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      env: process.env.NODE_ENV
    }
  });

  // Don't leak error details in production
  const isDevelopment = config.server.env === 'development';
  const errorResponse = {
    message: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  };

  // Set appropriate status code
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json(errorResponse);
});

// 404 handler for unmatched routes
app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  res.status(404).json({ message: 'Route not found' });
});

const PORT = config.server.port;
const env = config.server.env;

// SECURITY AUDIT: Check for HTTPS in production
if (env === 'production' && !config.server.httpsEnabled) {
  logger.warn('SECURITY WARNING: HTTPS not enforced in production environment');
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', {
    error: err.message,
    stack: err.stack
  });
  // Give some time for logging then exit
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise: promise.toString(),
    reason: reason?.message || reason,
    stack: reason?.stack
  });
  // Don't exit in production, just log
  if (config.server.env === 'production') {
    logger.error('Unhandled promise rejection in production - continuing...');
  } else {
    // In development, exit to catch issues
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
});

if (process.env.NODE_ENV !== 'test') {
  (async () => {
    await setup();
    app.listen(PORT, () => {
      logger.info(`Server started in ${env} mode on port ${PORT}`);
    }).on('error', (err) => {
      logger.error(`Server failed to start: ${err.message}`);
      process.exit(1);
    });
  })();
}

module.exports = app;