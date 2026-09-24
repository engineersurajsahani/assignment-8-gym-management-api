require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');

const connectDB = require('./config/db');
require('./config/passport'); // Initialize passport config

const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const memberRoutes = require('./routes/memberRoutes');

// Connect to Database
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'gym_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set true for https
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/members', memberRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the Gym & Fitness Club API');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
