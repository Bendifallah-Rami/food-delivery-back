const user = require('../controllers/userContollers');
const express = require('express');
const { authenticateToken, authorize } = require('../middleware/auth');
const router = express.Router();

//user routes with authentication and authorization
// Get all users - Admin only
router.get('/', authenticateToken, authorize('admin'), user.getAllUsers);

// Get user by ID - Authenticated users (with role-based access in controller)
router.get('/:id', authenticateToken, user.getUserById);

// Create user - Admin only (customers should use /api/auth/register)
router.post('/', authenticateToken, authorize('admin'), user.addUser);

// Update user - Users can update their own profile, admins can update any
router.put('/:id', authenticateToken, user.updateUser);

// Delete user - Admin only
router.delete('/:id', authenticateToken, authorize('admin'), user.deleteUser);

module.exports = router; 