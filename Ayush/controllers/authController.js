const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');

const register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      membershipTier,
      durationMonths,
      emergencyContact,
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'username, email and password are required',
      });
    }

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already in use',
      });
    }

    const months = Number(durationMonths) > 0 ? Number(durationMonths) : 1;
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      membershipTier: membershipTier || 'Bronze',
      membershipExpiryDate: expiryDate,
      emergencyContact,
    });

    return res.status(201).json({
      success: true,
      message: 'Member registered successfully',
      data: newUser.toSafeObject(),
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: (info && info.message) || 'Invalid credentials',
      });
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      return res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: user.toSafeObject(),
      });
    });
  })(req, res, next);
};

const logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      return res.status(200).json({ success: true, message: 'Logged out successfully' });
    });
  });
};

const getMe = (req, res) => {
  const user = req.user;
  const now = new Date();
  const expiry = new Date(user.membershipExpiryDate);
  const msRemaining = expiry - now;
  const remainingDays = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  return res.status(200).json({
    success: true,
    data: {
      ...user.toSafeObject(),
      remainingDays,
    },
  });
};

module.exports = { register, login, logout, getMe };
