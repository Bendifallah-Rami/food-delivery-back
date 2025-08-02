const express = require('express');
const categoryController = require('../controllers/categoryController');
const { authenticateToken, authorize } = require('../middleware/auth');
const router = express.Router();

// Public routes (no authentication required)
// Get active categories - for public menu display
router.get('/active', categoryController.getActiveCategories);

// Protected routes (authentication required)
// Get all categories - Admin and Staff can view all categories
router.get('/', authenticateToken, authorize('admin', 'staff'), categoryController.getAllCategories);

// Get category by ID - Admin and Staff only
router.get('/:id', authenticateToken, authorize('admin', 'staff'), categoryController.getCategoryById);

// Admin-only routes
// Create new category - Admin only
router.post('/', authenticateToken, authorize('admin'), categoryController.createCategory);

// Update category - Admin only
router.put('/:id', authenticateToken, authorize('admin'), categoryController.updateCategory);

// Delete category - Admin only
router.delete('/:id', authenticateToken, authorize('admin'), categoryController.deleteCategory);

// Toggle category status - Admin only
router.patch('/:id/toggle-status', authenticateToken, authorize('admin'), categoryController.toggleCategoryStatus);

module.exports = router;
