const express = require('express');
const router = express.Router();
const { register, login, getMe, logout } = require('../controllers/authController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', ensureAuthenticated, getMe);
router.post('/logout', logout);

module.exports = router;
