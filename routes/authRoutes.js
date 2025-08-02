//auth routes
const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authContoller');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

// Local authentication routes with specific rate limiting
router.post('/login', authLimiter, authController.login);
router.post('/register', registerLimiter, authController.register);

// Google OAuth routes (no rate limiting needed as Google handles this)
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