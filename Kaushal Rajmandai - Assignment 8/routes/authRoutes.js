const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', ensureAuthenticated, getProfile);

module.exports = router;