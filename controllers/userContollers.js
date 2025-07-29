const { User } = require("../models"); // Ensure this path is correct

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getUserById = async (req, res) => {
  // const  {id} =req.params;
  try {
    const userData = await User.findByPk(req.params.id);
    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(userData);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    const [updated] = await User.update(req.body, {
      where: { id: Id },
    });
    if (updated) {
      const updatedUser = await User.findByPk(Id);
      res.status(200).json({ message: `User ${updatedUser.firstName} updated successfully` });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteUser = async (req, res) => {
    const id = req.params.id;
     try{
            const deleteUser = await User.destroy({
                where: { id: id }
            });
            if (deleteUser) {
                res.status(200).json({ message: `User with ID ${id} deleted successfully` });
            } else {
                res.status(404).json({ error: "User not found" });
            }
     }catch(err){
         res.status(500).json({ error: err.message });
     } 
}

module.exports = {
  getAllUsers,
  getUserById,
  addUser,
  updateUser,
  deleteUser
};
