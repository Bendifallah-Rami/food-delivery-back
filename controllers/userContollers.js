const { User } = require("../models"); // Ensure this path is correct

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { 
        exclude: ['password'] // Exclude password from response
      }
    });
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};
const getUserById = async (req, res) => {
  try {
    const requestedUserId = parseInt(req.params.id);
    const currentUser = req.user; // This comes from authenticateToken middleware

    // Check if user is trying to access their own profile or if they are admin
    if (currentUser.role !== 'admin' && currentUser.id !== requestedUserId) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You can only view your own profile."
      });
    }

    const userData = await User.findByPk(requestedUserId, {
      attributes: { 
        exclude: ['password'] // Exclude password from response
      }
    });

    if (!userData) {
      return res.status(404).json({ 
        success: false,
        error: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};




const deleteUser = async (req, res) => {
    const id = req.params.id;
     try{
            const deleteUser = await User.destroy({
                where: { id: id }
            });
            if (deleteUser) {
                res.status(200).json({ 
                    success: true,
                    message: `User with ID ${id} deleted successfully` 
                });
            } else {
                res.status(404).json({ 
                    success: false,
                    error: "User not found" 
                });
            }
     }catch(err){
         res.status(500).json({ 
             success: false,
             error: err.message  
         });
     } 
};

const addUser = async (req, res) => {
  try {
    // Only admin can create users directly (customers should use registration)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: "Access denied. Only administrators can create users directly."
      });
    }

    const newUser = await User.create(req.body);
    
    // Remove password from response
    const userResponse = await User.findByPk(newUser.id, {
      attributes: { exclude: ['password'] }
    });

    res.status(201).json({ 
      success: true,
      message: `User ${newUser.firstName} created successfully`,
      data: userResponse
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

const updateUser = async (req, res) => {
  const requestedUserId = parseInt(req.params.id);
  const currentUser = req.user;

  try {
    // Check if user is trying to update their own profile or if they are admin
    if (currentUser.role !== 'admin' && currentUser.id !== requestedUserId) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You can only update your own profile."
      });
    }

    // Remove password from update data if present (should use separate endpoint for password changes)
    const { password, role, ...updateData } = req.body;
    
    // Only admin can change roles
    if (role && currentUser.role === 'admin') {
      updateData.role = role;
    }
    
    const [updated] = await User.update(updateData, {
      where: { id: requestedUserId },
    });

    if (updated) {
      const updatedUser = await User.findByPk(requestedUserId, {
        attributes: { 
          exclude: ['password'] // Exclude password from response
        }
      });
      res.status(200).json({ 
        success: true,
        message: `User ${updatedUser.firstName} updated successfully`,
        data: updatedUser
      });
    } else {
      res.status(404).json({ 
        success: false,
        error: "User not found" 
      });
    }
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  addUser,
  updateUser,
  deleteUser
};
