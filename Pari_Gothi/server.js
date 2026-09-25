require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const connectDB = require('./config/db');

// Validate critical environment variables
if (!process.env.MONGO_URI) {
  console.error('\n❌ CRITICAL CONFIGURATION ERROR:');
  console.error('MONGO_URI is not set in process.env or .env file.');
  console.error('Please create a .env file with a valid MongoDB connection string.\n');
}

// Connect to MongoDB Atlas
connectDB();

// Initialize Express app
const app = express();

// Trust proxy for secure cookies behind HTTPS reverse proxies (e.g., Render, Heroku)
app.set('trust proxy', 1);

// Passport configuration
require('./config/passport')(passport);

// Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session Configuration
const isProduction = process.env.NODE_ENV === 'production';
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'gym_management_super_secret_session_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction, // Set to true in production behind HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Root / Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🏋️‍♂️ Gym & Fitness Club Management REST API is running.',
    version: '1.0.0',
    documentation: '/api/classes, /api/auth, /api/members'
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/members', require('./routes/memberRoutes'));

// 404 Route Not Found Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [Environment: ${process.env.NODE_ENV || 'development'}]`);
});
