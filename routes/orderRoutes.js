const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const {
  getAllOrders,
  getOrderById,
  getMyOrders,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStatistics
} = require('../controllers/orderController');

// Apply authentication to all routes
router.use(authenticateToken);

// GET routes

// Get all orders (Staff/Admin only)
router.get('/', authorize('staff', 'admin'), getAllOrders);

// Get order statistics (Staff/Admin only)
router.get('/statistics', authorize('staff', 'admin'), getOrderStatistics);

// Get current user's orders (Customer)
router.get('/my-orders', getMyOrders);

// Get order by ID (Customer can only see their own orders, Staff/Admin can see all)
router.get('/:id', getOrderById);

// POST routes

// Create new order (Customer only)
router.post('/', authorize('customer'), createOrder);

// PUT routes

// Update order status (Staff/Admin only)
router.put('/:id/status', authorize('staff', 'admin'), updateOrderStatus);

// Cancel order (Customer can cancel their own pending/confirmed orders, Admin can cancel any)
router.put('/:id/cancel', cancelOrder);

module.exports = router;
