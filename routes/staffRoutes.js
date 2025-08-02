const express = require('express');
const router = express.Router();
const {
  getAllStaff,
  getStaffById,
  getMyProfile,
  createStaff,
  updateStaff,
  deactivateStaff,
  activateStaff,
  deleteStaff,
  getStaffStats
} = require('../controllers/staffController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Public routes (none for staff - all require authentication)

// Staff routes (require authentication)
router.use(authenticateToken);

// Get current staff member's profile
router.get('/my-profile', authorize('staff', 'admin'), getMyProfile);

// Update current staff member's profile (staff can update their own profile)
router.put('/my-profile', authorize('staff', 'admin'), async (req, res) => {
  try {
    // Find staff record by userId first
    const staff = await require('../models').Staff.findOne({ 
      where: { userId: req.user.id } 
    });
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff profile not found'
      });
    }
    
    // Set the staff ID as the parameter
    req.params.id = staff.id;
    updateStaff(req, res);
  } catch (error) {
    console.error('Error finding staff for profile update:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating staff profile'
    });
  }
});

// Admin-only routes
router.get('/stats', authorize('admin'), getStaffStats);
router.get('/', authorize('admin'), getAllStaff);
router.post('/', authorize('admin'), createStaff);

// Manager and Admin routes (for now, only admin until we implement position-based auth)
router.get('/:id', authorize('admin'), getStaffById);
router.put('/:id', authorize('admin'), updateStaff);
router.patch('/:id/deactivate', authorize('admin'), deactivateStaff);
router.patch('/:id/activate', authorize('admin'), activateStaff);
router.delete('/:id', authorize('admin'), deleteStaff);

module.exports = router;
