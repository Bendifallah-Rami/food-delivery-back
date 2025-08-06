const express = require('express');
const router = express.Router();
const {
  getAllMenuItems,
  getMenuItemsByCategory,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem,
  getLowStockItems,
  getPopularItems
} = require('../controllers/menuItemController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Public routes (no authentication required)

// Get all menu items with filtering (public - customers can browse)
router.get('/', getAllMenuItems);

// Get menu items by category (public)
router.get('/category/:categoryId', getMenuItemsByCategory);

// Get single menu item details (public)
router.get('/:id', getMenuItemById);

// Get popular items (public)
router.get('/analytics/popular', getPopularItems);

// Protected routes (require authentication)
router.use(authenticateToken);

// Staff and Admin routes (require authentication)

// Get low stock items (Staff/Admin only)
router.get('/analytics/low-stock', authorize('staff', 'admin'), getLowStockItems);

// Create new menu item (Staff/Admin only)
router.post('/', authorize('staff', 'admin'), createMenuItem);

// Update menu item (Staff/Admin only)
router.put('/:id', authorize('staff', 'admin'), updateMenuItem);

// Toggle menu item availability (Staff/Admin only)
router.patch('/:id/toggle-availability', authorize('staff', 'admin'), toggleAvailability);

// Admin-only routes

// Delete menu item (Admin only)
router.delete('/:id', authorize('admin'), deleteMenuItem);

module.exports = router;
