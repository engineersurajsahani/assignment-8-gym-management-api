const express = require('express');
const passport = require('passport');

const { register, login, getMe, logout } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/auth/register — create a new member.
router.post('/register', register);

// POST /api/auth/login — Passport Local + session login.
router.post('/login', passport.authenticate('local'), login);

// GET /api/auth/me — current logged-in member (protected).
router.get('/me', authMiddleware, getMe);

// POST /api/auth/logout — destroy the session (protected).
router.post('/logout', authMiddleware, logout);

module.exports = router;