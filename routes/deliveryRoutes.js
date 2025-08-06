const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const {
  createDelivery,
  getAllDeliveries,
  getMyDeliveries,
  getDeliveryById,
  updateDeliveryStatus,
  assignDelivery,
  getDeliveryTracking,
  getDeliveryStatistics
} = require('../controllers/deliveryController');

// Apply authentication to all routes
router.use(authenticateToken);

// GET routes

// Get all deliveries (Staff/Admin only)
router.get('/', authorize('staff', 'admin'), getAllDeliveries);

// Get delivery statistics (Staff/Admin only)
router.get('/statistics', authorize('staff', 'admin'), getDeliveryStatistics);

// Get current delivery person's assigned deliveries (Delivery Staff only)
router.get('/my-deliveries', authorize('staff'), getMyDeliveries);

// Get delivery tracking by order ID (Customer can track their own orders, Staff/Admin can track all)
router.get('/tracking/:orderId', getDeliveryTracking);

// Get delivery by ID (Staff/Admin only, Delivery staff can see their own)
router.get('/:id', authorize('staff', 'admin'), getDeliveryById);

// POST routes

// Create new delivery (Staff/Admin only)
router.post('/', authorize('staff', 'admin'), createDelivery);

// PUT routes

// Update delivery status (Delivery Staff can update their own, Staff/Admin can update any)
router.put('/:id/status', authorize('staff', 'admin'), updateDeliveryStatus);

// Assign delivery to delivery person (Staff/Admin only)
router.put('/:id/assign', authorize('staff', 'admin'), assignDelivery);

module.exports = router;
