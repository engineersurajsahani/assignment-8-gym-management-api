const express = require('express');
const passport = require('passport');

const {
  register,
  login,
  getMe,
  logout,
} = require('../controllers/authController');

const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);

router.post(
  '/login',
  passport.authenticate('local'),
  login
);

router.get('/me', requireAuth, getMe);

router.post('/logout', requireAuth, logout);

module.exports = router;