const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { testConnection } = require('./config/database');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');

dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());


// app.use(express.urlencoded({ extended: true }));


//routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);




// Test route
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
