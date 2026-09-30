const express = require('express');
const passport = require('passport');

const {
  register,
  login,
  getMe,
  logout
} = require('../controllers/authController');

const router = express.Router();

// Register
router.post('/register', register);

// Login
router.post('/login', passport.authenticate('local'), login);

// Current logged-in user
router.get('/me', getMe);

// Logout
router.post('/logout', logout);

module.exports = router;