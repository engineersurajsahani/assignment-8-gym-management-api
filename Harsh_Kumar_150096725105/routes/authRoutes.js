const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);

router.post('/login', passport.authenticate('local', { failWithError: true }), 
  (req, res) => {
    res.json({ message: 'Logged in successfully', user: req.user });
  },
  (err, req, res, next) => {
    res.status(401).json({ message: 'Invalid credentials' });
  }
);

router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
