

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { User } = require('../models');

const register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, role } = req.body;

        // Validate required fields
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: email, password, firstName, lastName'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Validate password strength (minimum 6 characters)
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            where: { email: email.toLowerCase() } 
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Generate salt and hash password
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await User.create({
            email: email.toLowerCase(),
            password: hashedPassword,
            firstName,
            lastName,
            phone: phone || null,
            role: role || 'customer', // Default to customer if no role specified
            isActive: true,
            emailVerified: false
        });

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: newUser.id, 
                email: newUser.email, 
                role: newUser.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );

        // Set JWT token in HTTP-only cookie
        const cookieOptions = {
            expires: new Date(Date.now() + (process.env.COOKIE_EXPIRE || 24) * 60 * 60 * 1000), // 24 hours
            httpOnly: process.env.COOKIE_HTTP_ONLY === 'true' || true, // Prevent XSS attacks
            secure: process.env.COOKIE_SECURE === 'true' || false, // HTTPS only in production
            sameSite: 'strict' // CSRF protection
        };

        res.cookie('token', token, cookieOptions);

        // Prepare response (exclude password)
        const userResponse = {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            phone: newUser.phone,
            role: newUser.role,
            isActive: newUser.isActive,
            emailVerified: newUser.emailVerified,
            createdAt: newUser.createdAt
        };

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: userResponse,
                token
            }
        });

    } catch (error) {
        console.error('Registration error:', error);

        // Handle Sequelize validation errors
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors.map(err => ({
                    field: err.path,
                    message: err.message
                }))
            });
        }

        // Handle Sequelize unique constraint errors
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Generic error response
        res.status(500).json({
            success: false,
            message: 'Internal server error during registration'
        });
    }
};

// Google OAuth signup/login
const googleAuth = passport.authenticate('google', {
    scope: ['profile', 'email']
});

const googleCallback = async (req, res) => {
    try {
        // Generate JWT token for the OAuth user
        const token = jwt.sign(
            { 
                userId: req.user.id, 
                email: req.user.email, 
                role: req.user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );

        // Set JWT token in HTTP-only cookie
        const cookieOptions = {
            expires: new Date(Date.now() + (process.env.COOKIE_EXPIRE || 24) * 60 * 60 * 1000),
            httpOnly: process.env.COOKIE_HTTP_ONLY === 'true' || true,
            secure: process.env.COOKIE_SECURE === 'true' || false,
            sameSite: 'strict'
        };

        res.cookie('token', token, cookieOptions);

        // Prepare user response
        const userResponse = {
            id: req.user.id,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            phone: req.user.phone,
            role: req.user.role,
            avatar: req.user.avatar,
            provider: req.user.provider,
            isOAuthUser: req.user.isOAuthUser,
            isActive: req.user.isActive,
            emailVerified: req.user.emailVerified,
            createdAt: req.user.createdAt
        };

        // Redirect to frontend with success
        // You can change this URL to your frontend success page
        const frontendUrl = 'http://localhost:3000/menu';
        res.redirect(`${frontendUrl}`);

    } catch (error) {
        console.error('Google OAuth callback error:', error);
        const frontendUrl = 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/error?message=Authentication failed`);
    }
};

// Login function (enhanced to handle both local and OAuth users)
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user by email
        const user = await User.findOne({ where: { email: email.toLowerCase() } });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is OAuth user trying to login with password
        if (user.isOAuthUser && user.provider !== 'local') {
            return res.status(400).json({
                success: false,
                message: `This account is linked with ${user.provider}. Please use ${user.provider} to sign in.`,
                provider: user.provider
            });
        }

        // Check password for local users
        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: 'This account has no password set. Please use OAuth to sign in.'
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );

        // Set JWT token in HTTP-only cookie
        const cookieOptions = {
            expires: new Date(Date.now() + (process.env.COOKIE_EXPIRE || 24) * 60 * 60 * 1000),
            httpOnly: process.env.COOKIE_HTTP_ONLY === 'true' || true,
            secure: process.env.COOKIE_SECURE === 'true' || false,
            sameSite: 'strict'
        };

        res.cookie('token', token, cookieOptions);

        // Update last login
        await user.update({ lastLogin: new Date() });

        // Prepare response
        const userResponse = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: user.role,
            avatar: user.avatar,
            provider: user.provider,
            isOAuthUser: user.isOAuthUser,
            isActive: user.isActive,
            emailVerified: user.emailVerified
        };

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userResponse,
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login'
        });
    }
};

// Logout function
const logout = (req, res) => {
    try {
        // Clear the JWT token cookie
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.COOKIE_SECURE === 'true' || false,
            sameSite: 'strict'
        });

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    googleAuth,
    googleCallback
};