const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getNotificationStats,
  cleanupExpiredNotifications
} = require('../controllers/notificationController');

// Import middleware
const { authenticateToken, authorize } = require('../middleware/auth');
const {
  // Rate limiters
  createNotificationLimiter,
  bulkOperationLimiter,
  // Validation middleware
  validateNotificationInput,
  validateNotificationId,
  validateQueryParams,
  // Authorization middleware
  authorizeNotificationAccess,
  // Utility middleware
  limitPageSize,
  logNotificationOperation,
  setNotificationHeaders
} = require('../middleware/notificationMiddleware');

// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Notification service is healthy',
    timestamp: new Date().toISOString()
  });
});

// Apply authentication to all routes below this point
router.use(authenticateToken);

// Apply common middleware for all notification routes
router.use(setNotificationHeaders);
router.use(logNotificationOperation);

/**
 * @route GET /api/notifications
 * @desc Get notifications for current user (paginated)
 * @access Private
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 50)
 * @query {string} type - Filter by notification type
 * @query {boolean} isRead - Filter by read status
 * @query {string} priority - Filter by priority level
 */
router.get('/', 
  validateQueryParams,
  limitPageSize,
  getNotifications
);

/**
 * @route PUT /api/notifications/:id/read
 * @desc Mark specific notification as read
 * @access Private
 * @param {string} id - Notification ID
 */
router.put('/:id/read', 
  validateNotificationId,
  markAsRead
);

/**
 * @route PUT /api/notifications/read-all
 * @desc Mark all notifications as read for current user
 * @access Private
 */
router.put('/read-all', 
  bulkOperationLimiter, 
  markAllAsRead
);

/**
 * @route POST /api/notifications/cleanup
 * @desc Clean up expired notifications (Admin only)
 * @access Admin
 */
router.post('/cleanup',
  bulkOperationLimiter,
  authorizeNotificationAccess,
  cleanupExpiredNotifications
);

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete specific notification (soft delete)
 * @access Private
 * @param {string} id - Notification ID
 */
router.delete('/:id', 
  validateNotificationId,
  deleteNotification
);

/**
 * @route POST /api/notifications/create
 * @desc Create new notification (Admin only)
 * @access Admin
 * @body {string} title - Notification title (required)
 * @body {string} message - Notification message (required)
 * @body {string} type - Notification type (required)
 * @body {string} priority - Priority level (default: medium)
 * @body {number} userId - Target user ID (optional)
 * @body {boolean} sendToAll - Send to all users (optional)
 * @body {string} userRole - Target specific role (optional)
 * @body {string} actionUrl - Action URL (optional)
 * @body {string} expiresAt - Expiration date (optional)
 */
router.post('/create', 
  createNotificationLimiter,
  validateNotificationInput,
  authorizeNotificationAccess,
  createNotification
);

/**
 * @route GET /api/notifications/stats
 * @desc Get notification statistics (Admin only)
 * @access Admin
 * @query {string} period - Time period (today, this_week, this_month)
 */
router.get('/stats', 
  authorizeNotificationAccess,
  getNotificationStats
);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Notification route error:', error);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error in notification service',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});
 
module.exports = router;
