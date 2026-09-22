const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const session = require('express-session');

const connectDB = require('./config/db');
const passport = require('./config/passport');

const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const memberRoutes = require('./routes/memberRoutes');

const app = express();

// ------------------------------------------------------------------
// Basic middleware
// CLIENT_ORIGIN is configurable so the same code works locally and on
// Render. It may be a single origin or a comma-separated list.
// ------------------------------------------------------------------
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header (Postman, curl, health checks).
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true
  })
);
app.use(express.json());

// ------------------------------------------------------------------
// Express session + Passport (order matters)
// Uses SESSION_SECRET from the environment. On Render this must be set
// in the dashboard; a development fallback prevents a crash if it is
// accidentally missing.
// ------------------------------------------------------------------
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_insecure_session_secret';
if (!process.env.SESSION_SECRET) {
  console.warn('WARNING: SESSION_SECRET not set. Using an insecure development fallback.');
}

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 12 } // 12 hours
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ------------------------------------------------------------------
// Routes
// ------------------------------------------------------------------
app.get('/', (req, res) => {
  res.json({ message: 'Gym & Fitness Club Management REST API is running' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Gym API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/members', memberRoutes);

// ------------------------------------------------------------------
// 404 handler for unknown API routes
// ------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ------------------------------------------------------------------
// Global error handler — never exposes stack traces to API users.
// ------------------------------------------------------------------
app.use((err, req, res, next) => {
  if (req.session) {
    req.session.destroy(() => {});
  }
  if (res.headersSent) {
    return next(err);
  }
  console.error('Server error:', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

// ------------------------------------------------------------------
// Boot the server only after MongoDB connects successfully.
// ------------------------------------------------------------------
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});