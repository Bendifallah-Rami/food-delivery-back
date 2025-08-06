const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const {
  createPayment,
  getPaymentByOrderId,
  getPaymentById,
  getAllPayments,
  updatePaymentStatus,
  processRefund,
  getPaymentStatistics
} = require('../controllers/paymentController');

// Apply authentication to all routes
router.use(authenticateToken);

// GET routes

// Get all payments (Staff/Admin only)
router.get('/', authorize('staff', 'admin'), getAllPayments);

// Get payment statistics (Staff/Admin only)
router.get('/statistics', authorize('staff', 'admin'), getPaymentStatistics);

// Get payment by order ID (Customer can see their own, Staff/Admin can see all)
router.get('/order/:orderId', getPaymentByOrderId);

// Get payment by ID (Customer can see their own, Staff/Admin can see all)
router.get('/:id', getPaymentById);

// POST routes

// Create payment (Customer for their orders, Staff/Admin for any order)
router.post('/', createPayment);

// Process refund (Staff/Admin only)
router.post('/:id/refund', authorize('staff', 'admin'), processRefund);

// PUT routes

// Update payment status (Staff/Admin only)
router.put('/:id/status', authorize('staff', 'admin'), updatePaymentStatus);

module.exports = router;
