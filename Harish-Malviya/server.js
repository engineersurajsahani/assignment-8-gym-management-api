require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const connectDB = require('./config/db');

// Initialize Passport config
require('./config/passport')(passport);

// Initialize Express App
const app = express();

// Connect to Database
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session Configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'gym_management_default_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
  })
);

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Root API Health Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🏋️ Gym & Fitness Club Management REST API is running!',
    endpoints: {
      auth: '/api/auth',
      classes: '/api/classes',
      members: '/api/members'
    },
    version: '1.0.0'
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/members', require('./routes/memberRoutes'));

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app;
