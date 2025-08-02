const express = require('express');
const router = express.Router();
const {
  testEmailConfig,
  sendTestEmail,
  sendBulkEmail,
  sendStaffNotification,
  getEmailStatus
} = require('../controllers/emailController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Admin-only routes (require authentication and admin role)
router.use(authenticateToken);

// Get email service status (Admin only)
router.get('/status', authorize('admin'), getEmailStatus);

// Test email configuration (Admin only)
router.get('/test-config', authorize('admin'), testEmailConfig);

// Send test email (Admin only)
router.post('/test', authorize('admin'), sendTestEmail);

// Send bulk email to customers/staff (Admin only)
router.post('/bulk', authorize('admin'), sendBulkEmail);

// Send staff notification (Admin only)
router.post('/staff-notification', authorize('admin'), sendStaffNotification);

module.exports = router;
