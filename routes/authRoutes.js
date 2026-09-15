const express = require('express');
const router = express.Router();
const { register, login, me: getMe } = require('../controllers/authController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me
router.get('/me', ensureAuthenticated, getMe);

module.exports = router;
