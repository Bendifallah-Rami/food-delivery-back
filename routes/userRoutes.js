 const user = require('../controllers/userContollers');
const express = require('express');
const router = express.Router();


//user routes 
router.get('/', user.getAllUsers);
router.get('/:id', user.getUserById);
router.post('/', user.addUser);
router.put('/:id', user.updateUser);
router.delete('/:id', user.deleteUser )
module.exports = router;