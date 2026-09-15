require('dotenv').config({ override: true });
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const { connectDB } = require('./config/db');
require('./config/passport');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/members', require('./routes/memberRoutes'));

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Gym & Fitness Club Management API',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new member',
        'POST /api/auth/login': 'Login',
        'GET /api/auth/me': 'Get current user'
      },
      classes: {
        'GET /api/classes': 'Get all classes (supports ?trainer=)',
        'GET /api/classes/:id': 'Get class details',
        'POST /api/classes': 'Create class (auth required)',
        'POST /api/classes/:id/book': 'Book class (auth required)',
        'DELETE /api/classes/:id/cancel': 'Cancel booking (auth required)'
      },
      members: {
        'PATCH /api/members/:id/renew': 'Renew membership (auth required)',
        'GET /api/members/expired': 'Get expired memberships',
        'GET /api/members/:id': 'Get member by ID (auth required)'
      }
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    db: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
