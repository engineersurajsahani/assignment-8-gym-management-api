require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const connectDB = require('./config/db');
const passport = require('./config/passport');

const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const memberRoutes = require('./routes/memberRoutes');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/members', memberRoutes);

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Gym & Fitness Club Management API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
