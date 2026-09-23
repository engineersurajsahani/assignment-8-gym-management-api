const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { username, email, password, membershipTier, durationMonths, emergencyContact } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    const existingUser = await User.findOne({
      $or: [{ username: username.trim() }, { email: email.toLowerCase().trim() }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already registered'
      });
    }

    const months = parseInt(durationMonths, 10) || 1;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + months * 30);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      membershipTier: membershipTier || 'Bronze',
      membershipStatus: 'active',
      membershipExpiryDate: expiryDate,
      emergencyContact: emergencyContact || ''
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Member registered successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        membershipTier: user.membershipTier,
        membershipStatus: user.membershipStatus,
        membershipExpiryDate: user.membershipExpiryDate
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: info && info.message ? info.message : 'Invalid credentials'
      });
    }

    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          id: user._id,
          username: user.username,
          email: user.email,
          membershipTier: user.membershipTier,
          membershipStatus: user.membershipStatus,
          membershipExpiryDate: user.membershipExpiryDate
        }
      });
    });
  })(req, res, next);
};

exports.getProfile = async (req, res) => {
  try {
    const user = req.user;
    const now = new Date();
    const expiryDate = new Date(user.membershipExpiryDate);
    const diffMs = expiryDate.getTime() - now.getTime();
    const remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        membershipTier: user.membershipTier,
        membershipStatus: user.membershipStatus,
        membershipExpiryDate: user.membershipExpiryDate,
        remainingDays,
        emergencyContact: user.emergencyContact
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    });
  });
};
