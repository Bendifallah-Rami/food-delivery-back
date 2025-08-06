const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const {
  getAllStock,
  getStockById,
  getStockByMenuItemId,
  updateStock,
  addStock,
  reduceStock,
  checkStockAvailability,
  getLowStockAlerts,
  sendBulkLowStockAlert,
  getStockStatistics
} = require('../controllers/stockController');

// Apply authentication to all routes
router.use(authenticateToken);

// GET routes

// Get all stock records (Staff/Admin only)
router.get('/', authorize('staff', 'admin'), getAllStock);

// Get stock statistics (Staff/Admin only)
router.get('/statistics', authorize('staff', 'admin'), getStockStatistics);

// Get low stock alerts (Staff/Admin only)
router.get('/alerts/low-stock', authorize('staff', 'admin'), getLowStockAlerts);

// Send bulk low stock alert email (Staff/Admin only)
router.post('/alerts/send-bulk-alert', authorize('staff', 'admin'), sendBulkLowStockAlert);

// Get stock record by ID (Staff/Admin only)
router.get('/:id', authorize('staff', 'admin'), getStockById);

// Get stock by menu item ID (Staff/Admin only)
router.get('/menu-item/:menuItemId', authorize('staff', 'admin'), getStockByMenuItemId);

// PUT routes

// Update stock record (Staff/Admin only)
router.put('/:id', authorize('staff', 'admin'), updateStock);

// POST routes

// Check stock availability for multiple items (Staff/Admin only)
router.post('/check-availability', authorize('staff', 'admin'), checkStockAvailability);

// Add stock (inventory received) - Staff/Admin only
router.post('/menu-item/:menuItemId/add', authorize('staff', 'admin'), addStock);

// Reduce stock (for orders/consumption) - Staff/Admin only
router.post('/menu-item/:menuItemId/reduce', authorize('staff', 'admin'), reduceStock);

module.exports = router;
