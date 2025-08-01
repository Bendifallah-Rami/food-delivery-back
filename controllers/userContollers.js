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
    const userData = await User.findByPk(req.params.id, {
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
const addUser = async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    res
      .status(201)
      .json({ message: `User ${newUser.firstName} created successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateUser = async (req, res) => {
  const Id = req.params.id;
  try {
    // Remove password from update data if present (should use separate endpoint)
    const { password, ...updateData } = req.body;
    
    const [updated] = await User.update(updateData, {
      where: { id: Id },
    });
    if (updated) {
      const updatedUser = await User.findByPk(Id, {
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
}

module.exports = {
  getAllUsers,
  getUserById,
  addUser,
  updateUser,
  deleteUser
};
