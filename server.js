const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const { testConnection } = require('./config/database');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const userAddressRoutes = require('./routes/userAddressRoutes');
const staffRoutes = require('./routes/staffRoutes');
const emailRoutes = require('./routes/emailRoutes');
const menuItemRoutes = require('./routes/menuItemRoutes');
const stockRoutes = require('./routes/stockRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
// const testRoutes = require('./routes/testRoutes');
const { apiLimiter } = require('./middleware/rateLimiter');

// Load environment variables
dotenv.config();

// Initialize passport configuration
require('./config/passport');


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Apply general rate limiting to all other API routes
app.use('/api', apiLimiter);


// app.use(express.urlencoded({ extended: true }));


//routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/addresses', userAddressRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/menu-items', menuItemRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/reports', reportsRoutes);





// welcome route
app.get('/', (req, res) => {
  res.send("welcome to FUDO food delivery backend")
});

 
// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  testConnection();
});

module.exports = app;
