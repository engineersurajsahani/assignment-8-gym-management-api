const express = require('express');
const router = express.Router();
const { register, login, getMe, logout } = require('../controllers/authController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

// @route   POST /api/auth/register
// @desc    Register a new member with membership plan
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login via Passport Local strategy & create session
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/me
// @desc    Get current authenticated member profile & remaining membership days
// @access  Private (Session authenticated)
router.get('/me', ensureAuthenticated, getMe);

// @route   POST /api/auth/logout
// @desc    Destroy session and log out member
// @access  Private
router.post('/logout', ensureAuthenticated, logout);

module.exports = router;
