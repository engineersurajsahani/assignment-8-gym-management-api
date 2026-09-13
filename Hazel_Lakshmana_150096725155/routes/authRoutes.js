const express = require('express');
const passport = require('../config/passport');
const { register, login, getMe } = require('../controllers/authController');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);

router.post(
  '/login',
  passport.authenticate('local'),
  login
);

router.get('/me', requireAuth, getMe);

router.post('/logout', requireAuth, (req, res, next) => {
  req.logout((error) => {
    if (error) return next(error);

    req.session.destroy((sessionError) => {
      if (sessionError) {
        return res.status(500).json({ message: 'Logout failed' });
      }

      res.clearCookie('connect.sid');
      res.status(200).json({ message: 'Logout successful' });
    });
  });
});

module.exports = router;
