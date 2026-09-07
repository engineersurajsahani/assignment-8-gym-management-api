require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('./config/passport');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const memberRoutes = require('./routes/memberRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.json({ message: 'Gym & Fitness Club Management API is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/members', memberRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
