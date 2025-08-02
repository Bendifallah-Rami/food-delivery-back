const { Staff, User } = require('../models');
const { Op } = require('sequelize');

// Get all staff members (Admin only)
const getAllStaff = async (req, res) => {
  try {
    const { page = 1, limit = 10, position, isActive, search } = req.query;
    const offset = (page - 1) * limit;

    const whereConditions = {};
    
    // Filter by position
    if (position && ['kitchen', 'delivery', 'manager'].includes(position)) {
      whereConditions.position = position;
    }
    
    // Filter by active status
    if (isActive !== undefined) {
      whereConditions.isActive = isActive === 'true';
    }

    const userWhereConditions = {};
    
    // Search by name or email
    if (search) {
      userWhereConditions[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const staff = await Staff.findAndCountAll({
      where: whereConditions,
      include: [{
        model: User,
        as: 'user',
        where: Object.keys(userWhereConditions).length > 0 ? userWhereConditions : undefined,
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'role']
      }],
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: staff.count,
      totalPages: Math.ceil(staff.count / limit),
      currentPage: parseInt(page),
      data: staff.rows
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff members'
    });
  }
};

// Get staff member by ID
const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await Staff.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'role']
      }]
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff member'
    });
  }
};

// Get current staff member's profile
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Use req.user.id instead of req.user.userId

    const staff = await Staff.findOne({
      where: { userId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'role']
      }]
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff profile not found'
      });
    }

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Error fetching staff profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff profile'
    });
  }
};

// Create new staff member (Admin only)
const createStaff = async (req, res) => {
  try {
    const {
      userId,
      employeeId,
      position,
      department,
      hireDate,
      salary,
      workingHours
    } = req.body;

    // Validate required fields
    if (!userId || !employeeId || !position) {
      return res.status(400).json({
        success: false,
        message: 'User ID, employee ID, and position are required'
      });
    }

    // Validate position
    if (!['kitchen', 'delivery', 'manager'].includes(position)) {
      return res.status(400).json({
        success: false,
        message: 'Position must be kitchen, delivery, or manager'
      });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already a staff member
    const existingStaff = await Staff.findOne({ where: { userId } });
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: 'User is already a staff member'
      });
    }

    // Check if employee ID is unique
    const existingEmployeeId = await Staff.findOne({ where: { employeeId } });
    if (existingEmployeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID already exists'
      });
    }

    // Update user role to staff if it's currently customer
    if (user.role === 'customer') {
      await user.update({ role: 'staff' });
    }

    const staff = await Staff.create({
      userId,
      employeeId,
      position,
      department,
      hireDate: hireDate || new Date(),
      salary,
      workingHours
    });

    const staffWithUser = await Staff.findByPk(staff.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'role']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: staffWithUser
    });
  } catch (error) {
    console.error('Error creating staff member:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating staff member'
    });
  }
};

// Update staff member (Admin or self)
const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      employeeId,
      position,
      department,
      hireDate,
      salary,
      workingHours,
      isActive
    } = req.body;

    const staff = await Staff.findByPk(id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Check permissions - admin can update anyone, staff can only update themselves
    if (req.user.role !== 'admin' && staff.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    // Validate position if provided
    if (position && !['kitchen', 'delivery', 'manager'].includes(position)) {
      return res.status(400).json({
        success: false,
        message: 'Position must be kitchen, delivery, or manager'
      });
    }

    // Check if employee ID is unique (if being updated)
    if (employeeId && employeeId !== staff.employeeId) {
      const existingEmployeeId = await Staff.findOne({ 
        where: { 
          employeeId,
          id: { [Op.ne]: id }
        } 
      });
      if (existingEmployeeId) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID already exists'
        });
      }
    }

    // Prepare update data (only include provided fields)
    const updateData = {};
    if (employeeId !== undefined) updateData.employeeId = employeeId;
    if (position !== undefined) updateData.position = position;
    if (department !== undefined) updateData.department = department;
    if (hireDate !== undefined) updateData.hireDate = hireDate;
    if (salary !== undefined) updateData.salary = salary;
    if (workingHours !== undefined) updateData.workingHours = workingHours;
    
    // Only admin can update isActive status
    if (req.user.role === 'admin' && isActive !== undefined) {
      updateData.isActive = isActive;
    }

    await staff.update(updateData);

    const updatedStaff = await Staff.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'role']
      }]
    });

    res.json({
      success: true,
      message: 'Staff member updated successfully',
      data: updatedStaff
    });
  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating staff member'
    });
  }
};

// Deactivate staff member (Admin only)
const deactivateStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await Staff.findByPk(id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    await staff.update({ isActive: false });

    res.json({
      success: true,
      message: 'Staff member deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating staff member:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating staff member'
    });
  }
};

// Activate staff member (Admin only)
const activateStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await Staff.findByPk(id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    await staff.update({ isActive: true });

    res.json({
      success: true,
      message: 'Staff member activated successfully'
    });
  } catch (error) {
    console.error('Error activating staff member:', error);
    res.status(500).json({
      success: false,
      message: 'Error activating staff member'
    });
  }
};

// Delete staff member (Admin only)
const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await Staff.findByPk(id, {
      include: [{
        model: User,
        as: 'user'
      }]
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Check if staff has deliveries
    const deliveryCount = await staff.countDeliveries();
    if (deliveryCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete staff member with existing deliveries. Consider deactivating instead.'
      });
    }

    // Update user role back to customer if they're not admin
    if (staff.user.role === 'staff') {
      await staff.user.update({ role: 'customer' });
    }

    await staff.destroy();

    res.json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting staff member'
    });
  }
};

// Get staff statistics (Admin only)
const getStaffStats = async (req, res) => {
  try {
    const totalStaff = await Staff.count();
    const activeStaff = await Staff.count({ where: { isActive: true } });
    const inactiveStaff = await Staff.count({ where: { isActive: false } });
    
    const staffByPosition = await Staff.findAll({
      attributes: [
        'position',
        [Staff.sequelize.fn('COUNT', Staff.sequelize.col('id')), 'count']
      ],
      group: ['position'],
      raw: true
    });

    const staffByPositionMap = {};
    staffByPosition.forEach(item => {
      staffByPositionMap[item.position] = parseInt(item.count);
    });

    res.json({
      success: true,
      data: {
        total: totalStaff,
        active: activeStaff,
        inactive: inactiveStaff,
        byPosition: {
          kitchen: staffByPositionMap.kitchen || 0,
          delivery: staffByPositionMap.delivery || 0,
          manager: staffByPositionMap.manager || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching staff statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff statistics'
    });
  }
};

module.exports = {
  getAllStaff,
  getStaffById,
  getMyProfile,
  createStaff,
  updateStaff,
  deactivateStaff,
  activateStaff,
  deleteStaff,
  getStaffStats
};
