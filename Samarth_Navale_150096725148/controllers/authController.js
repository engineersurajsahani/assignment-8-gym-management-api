const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');

const register = async (req, res, next) => {
  try {
    const { username, email, password, membershipTier, durationMonths = 1, emergencyContact } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email, and password required' });
    }

    const exist = await User.findOne({
      $or: [{ username }, { email: email.toLowerCase() }]
    });

    if (exist) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const months = Number(durationMonths) || 1;
    const expiry = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);

    const usr = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hash,
      membershipTier: membershipTier || 'Bronze',
      membershipStatus: 'active',
      membershipExpiryDate: expiry,
      emergencyContact
    });

    await usr.save();

    const safe = usr.toObject();
    delete safe.password;

    return res.status(201).json({
      success: true,
      message: 'Member registered successfully',
      data: safe
    });
  } catch (err) {
    next(err);
  }
};

const login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ success: false, message: info ? info.message : 'Invalid credentials' });
    }

    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);

      const safe = user.toObject();
      delete safe.password;

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: safe
      });
    });
  })(req, res, next);
};

const logout = (req, res) => {
  req.logout(() => {
    if (req.session) {
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        return res.status(200).json({ success: true, message: 'Logged out successfully' });
      });
    } else {
      return res.status(200).json({ success: true, message: 'Logged out successfully' });
    }
  });
};

const getMe = async (req, res, next) => {
  try {
    const usr = await User.findById(req.user._id).select('-password');
    if (!usr) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const diff = new Date(usr.membershipExpiryDate) - new Date();
    const daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));

    return res.status(200).json({
      success: true,
      data: {
        ...usr.toObject(),
        daysRemaining
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, getMe };
