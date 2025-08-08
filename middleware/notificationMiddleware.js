const NotificationService = require('../services/notificationService');
const rateLimit = require('express-rate-limit');

// Middleware to send notifications after order operations
const orderNotificationMiddleware = {
  
  // After order creation
  afterOrderCreation: async (req, res, next) => {
    res.on('finish', async () => {
      if (res.statusCode === 201 && res.locals.order) {
        try {
          await NotificationService.notifyNewOrder(
            res.locals.order.id,
            res.locals.order.customerId
          );
        } catch (error) {
          console.error('Error sending order creation notifications:', error);
        }
      }
    });
    next();
  },

  // After order status update
  afterOrderStatusUpdate: async (req, res, next) => {
    res.on('finish', async () => {
      if (res.statusCode === 200 && res.locals.orderUpdate) {
        try {
          await NotificationService.notifyOrderStatusChange(
            res.locals.orderUpdate.orderId,
            res.locals.orderUpdate.newStatus,
            res.locals.orderUpdate.customerId
          );
        } catch (error) {
          console.error('Error sending order status notifications:', error);
        }
      }
    });
    next();
  },

  // After payment confirmation
  afterPaymentConfirmation: async (req, res, next) => {
    res.on('finish', async () => {
      if (res.statusCode === 200 && res.locals.payment) {
        try {
          await NotificationService.notifyPaymentConfirmed(
            res.locals.payment.orderId,
            res.locals.payment.customerId,
            res.locals.payment.amount
          );
        } catch (error) {
          console.error('Error sending payment confirmation notifications:', error);
        }
      }
    });
    next();
  },

  // After delivery assignment
  afterDeliveryAssignment: async (req, res, next) => {
    res.on('finish', async () => {
      if (res.statusCode === 200 && res.locals.delivery) {
        try {
          await NotificationService.notifyDeliveryAssigned(
            res.locals.delivery.orderId,
            res.locals.delivery.customerId,
            res.locals.delivery.staffId
          );
        } catch (error) {
          console.error('Error sending delivery assignment notifications:', error);
        }
      }
    });
    next();
  }
};

// Middleware to send security notifications
const securityNotificationMiddleware = {
  
  // After failed login attempts
  afterFailedLogin: async (req, res, next) => {
    res.on('finish', async () => {
      if (res.statusCode === 401 && req.body.email) {
        try {
          // Find user by email to send security alert
          const User = require('../models').User;
          const user = await User.findOne({ where: { email: req.body.email } });
          
          if (user) {
            await NotificationService.notifySecurityAlert(
              user.id,
              'Failed Login Attempt',
              `Someone tried to access your account at ${new Date().toLocaleString()}`
            );
          }
        } catch (error) {
          console.error('Error sending security notification:', error);
        }
      }
    });
    next();
  },

  // After successful login from new device/IP
  afterNewDeviceLogin: async (req, res, next) => {
    res.on('finish', async () => {
      if (res.statusCode === 200 && res.locals.newDeviceLogin) {
        try {
          await NotificationService.notifySecurityAlert(
            res.locals.newDeviceLogin.userId,
            'New Device Login',
            `Login from new device/location at ${new Date().toLocaleString()}`
          );
        } catch (error) {
          console.error('Error sending new device notification:', error);
        }
      }
    });
    next();
  }
};

// Middleware to send system notifications
const systemNotificationMiddleware = {
  
  // After staff registration
  afterStaffRegistration: async (req, res, next) => {
    res.on('finish', async () => {
      if (res.statusCode === 201 && res.locals.newStaff) {
        try {
          await NotificationService.notifyNewStaffRegistration(
            res.locals.newStaff.id
          );
        } catch (error) {
          console.error('Error sending staff registration notification:', error);
        }
      }
    });
    next();
  },

  // Scheduled cleanup job
  scheduledCleanup: async () => {
    try {
      // Run every hour
      setInterval(async () => {
        await NotificationService.cleanupExpiredNotifications();
      }, 60 * 60 * 1000);
    } catch (error) {
      console.error('Error in scheduled cleanup:', error);
    }
  }
};

// ===== ROUTE-LEVEL MIDDLEWARE =====

// Rate limiting for notification creation
const createNotificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 notification creation requests per windowMs
  message: {
    success: false,
    message: 'Too many notification creation requests, please try again later'
  }
});

// Rate limiting for bulk operations
const bulkOperationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // limit each IP to 3 bulk operations per windowMs
  message: {
    success: false,
    message: 'Too many bulk operations, please try again later'
  }
});

// Input validation middleware for notifications
const validateNotificationInput = (req, res, next) => {
  const { title, message, type, priority } = req.body;
  
  if (req.method === 'POST') {
    // Validation for creating notifications
    if (!title || !message || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title, message, and type are required'
      });
    }

    const validTypes = ['order', 'delivery', 'promotion', 'system', 'payment'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid notification type. Valid options: ${validTypes.join(', ')}`
      });
    }

    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority level. Valid options: ${validPriorities.join(', ')}`
      });
    }

    // Sanitize inputs
    req.body.title = title.trim().substring(0, 255);
    req.body.message = message.trim().substring(0, 1000);
  }

  next();
};

// Security middleware for notification access control
const authorizeNotificationAccess = (req, res, next) => {
  const userRole = req.user.role;
  const operation = req.route.path;

  // Admin-only operations
  const adminOnlyOperations = ['/stats', '/create', '/cleanup'];
  
  if (adminOnlyOperations.some(op => operation.includes(op))) {
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
  }

  next();
};

// Middleware to limit page size for performance
const limitPageSize = (req, res, next) => {
  // Limit page size for performance
  if (req.query.limit && parseInt(req.query.limit) > 50) {
    req.query.limit = 50;
  }
  
  // Set default pagination values
  req.query.page = parseInt(req.query.page) || 1;
  req.query.limit = parseInt(req.query.limit) || 10;
  
  next();
};

// Middleware to validate notification ID parameter
const validateNotificationId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid notification ID'
    });
  }
  
  req.params.id = parseInt(id);
  next();
};

// Middleware to log notification operations for audit
const logNotificationOperation = (req, res, next) => {
  const operation = req.method + ' ' + req.route.path;
  const userId = req.user ? req.user.id : 'anonymous';
  const userRole = req.user ? req.user.role : 'none';
  
  console.log(`[NOTIFICATION] ${operation} - User: ${userId} (${userRole}) - IP: ${req.ip} - Time: ${new Date().toISOString()}`);
  
  next();
};

// Middleware to set notification-specific headers
const setNotificationHeaders = (req, res, next) => {
  // Set cache control for notifications
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  next();
};

// Middleware to validate query parameters for filtering
const validateQueryParams = (req, res, next) => {
  const { type, priority, isRead } = req.query;
  
  if (type) {
    const validTypes = ['order', 'delivery', 'promotion', 'system', 'payment'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type filter. Valid options: ${validTypes.join(', ')}`
      });
    }
  }
  
  if (priority) {
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority filter. Valid options: ${validPriorities.join(', ')}`
      });
    }
  }
  
  if (isRead !== undefined) {
    const validReadStatus = ['true', 'false'];
    if (!validReadStatus.includes(isRead)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid isRead filter. Use true or false'
      });
    }
  }
  
  next();
};

module.exports = {
  // Business logic middleware
  orderNotificationMiddleware,
  securityNotificationMiddleware,
  systemNotificationMiddleware,
  
  // Route-level middleware
  createNotificationLimiter,
  bulkOperationLimiter,
  validateNotificationInput,
  authorizeNotificationAccess,
  limitPageSize,
  validateNotificationId,
  logNotificationOperation,
  setNotificationHeaders,
  validateQueryParams
};
