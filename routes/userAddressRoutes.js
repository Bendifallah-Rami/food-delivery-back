const express = require('express');
const userAddressController = require('../controllers/userAddressController');
const { authenticateToken, authorize } = require('../middleware/auth');
const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// User's own addresses routes
// Get current user's addresses
router.get('/my-addresses', userAddressController.getMyAddresses);

// Create address for current user
router.post('/my-addresses', userAddressController.createAddress);

// Standard address management routes
// Get address by ID - Users can view their own addresses, admins can view any
router.get('/:id', userAddressController.getAddressById);

// Update address - Users can update their own addresses, admins can update any
router.put('/:id', userAddressController.updateAddress);

// Delete address - Users can delete their own addresses, admins can delete any
router.delete('/:id', userAddressController.deleteAddress);

// Set address as default - Users can set their own addresses as default, admins can do this for any user
router.patch('/:id/set-default', userAddressController.setDefaultAddress);

// Admin routes for managing user addresses
// Get all addresses for a specific user - Admin only
router.get('/user/:userId', authorize('admin'), userAddressController.getUserAddresses);

module.exports = router;
