const express = require('express');
const router = express.Router();
const { register, login, logout, getMe } = require('../controllers/authController');
const ensureAuthenticated = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', ensureAuthenticated, getMe);

module.exports = router;
