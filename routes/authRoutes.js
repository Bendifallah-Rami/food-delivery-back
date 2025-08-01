//auth routes
const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authContoller');
const router = express.Router();

// Local authentication routes
router.post('/login', authController.login);
router.post('/register', authController.register);

// Google OAuth routes
router.get('/google', authController.googleAuth);
router.post('/logout', authController.logout);



router.get('/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: '/auth/error',
        session: false 
    }), 
    authController.googleCallback
);

module.exports = router;