require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('passport');

const connectDB = require('./config/db');
require('./config/passport');

const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const memberRoutes = require('./routes/memberRoutes');

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'gym-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/members', memberRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Gym & Fitness Club Management API',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new member',
        'POST /api/auth/login': 'Login',
        'GET /api/auth/me': 'Get current user',
        'POST /api/auth/logout': 'Logout'
      },
      classes: {
        'GET /api/classes': 'List upcoming classes',
        'GET /api/classes/:id': 'Get class details',
        'POST /api/classes': 'Create new class',
        'POST /api/classes/:id/book': 'Book a class',
        'DELETE /api/classes/:id/cancel': 'Cancel booking'
      },
      members: {
        'PATCH /api/members/:id/renew': 'Renew membership',
        'GET /api/members/expired': 'List expired memberships'
      }
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3008;

app.listen(PORT, () => {
  console.log(`Gym Management API running on port ${PORT}`);
});
