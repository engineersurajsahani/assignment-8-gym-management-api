const passport = require('passport');
const User = require('../models/User');

// @desc    Register a new member with calculated membership expiry
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const {
      username,
      email,
      password,
      membershipTier,
      durationMonths,
      emergencyContact
    } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password.'
      });
    }

    // Check existing user
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { username: username.trim() }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with given username or email already exists.'
      });
    }

    // Calculate membership expiry date: exactly 30 days per month
    const months = parseInt(durationMonths, 10) || 1;
    if (months <= 0) {
      return res.status(400).json({
        success: false,
        message: 'durationMonths must be a positive number.'
      });
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + months * 30);

    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      membershipTier: membershipTier || 'Bronze',
      membershipStatus: 'active',
      membershipExpiryDate: expiryDate,
      emergencyContact: emergencyContact ? emergencyContact.trim() : undefined
    });

    const savedUser = await newUser.save();

    // Auto log-in member into session
    req.login(savedUser, (err) => {
      if (err) {
        return next(err);
      }
      return res.status(201).json({
        success: true,
        message: 'Member registered and logged in successfully',
        data: {
          id: savedUser._id,
          username: savedUser.username,
          email: savedUser.email,
          membershipTier: savedUser.membershipTier,
          membershipStatus: savedUser.membershipStatus,
          membershipExpiryDate: savedUser.membershipExpiryDate,
          remainingDays: savedUser.getRemainingDays(),
          emergencyContact: savedUser.emergencyContact
        }
      });
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

// @desc    Login member via Passport Local strategy
// @route   POST /api/auth/login
// @access  Public
exports.login = (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both username/email and password.'
    });
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({
        success: false,
        message: info ? info.message : 'Invalid credentials'
      });
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }
      return res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: {
          id: user._id,
          username: user.username,
          email: user.email,
          membershipTier: user.membershipTier,
          membershipStatus: user.membershipStatus,
          membershipExpiryDate: user.membershipExpiryDate,
          remainingDays: user.getRemainingDays()
        }
      });
    });
  })(req, res, next);
};

// @desc    Get currently logged-in member profile & remaining days
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        membershipTier: user.membershipTier,
        membershipStatus: user.membershipStatus,
        membershipExpiryDate: user.membershipExpiryDate,
        remainingDays: user.getRemainingDays(),
        emergencyContact: user.emergencyContact,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout member and destroy session
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    if (req.session) {
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          return next(sessionErr);
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({
          success: true,
          message: 'Logged out successfully'
        });
      });
    } else {
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    }
  });
};
