const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, password, membershipTier, durationMonths, emergencyContact } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password.'
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [{ username: username.trim() }, { email: email.toLowerCase().trim() }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email is already registered.'
      });
    }

    // Hash password with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Calculate expiry date: exactly 30 days per duration month
    const months = Number(durationMonths) || 1;
    const membershipExpiryDate = User.calculateExpiryDate(new Date(), months);

    // Create new member user
    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      membershipTier: membershipTier || 'Bronze',
      membershipStatus: 'active',
      membershipExpiryDate,
      emergencyContact: emergencyContact || ''
    });

    const savedUser = await newUser.save();

    // Return safe user object (without password)
    const userResponse = {
      _id: savedUser._id,
      username: savedUser.username,
      email: savedUser.email,
      membershipTier: savedUser.membershipTier,
      membershipStatus: savedUser.membershipStatus,
      membershipExpiryDate: savedUser.membershipExpiryDate,
      emergencyContact: savedUser.emergencyContact,
      createdAt: savedUser.createdAt
    };

    return res.status(201).json({
      success: true,
      message: 'Member registered successfully.',
      user: userResponse
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error registering member.'
    });
  }
};

// POST /api/auth/login
const login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server error during authentication.',
        error: err.message
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info && info.message ? info.message : 'Invalid credentials.'
      });
    }

    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to establish session.',
          error: err.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully.',
        user: {
          _id: user._id,
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

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    const remainingDays = user.getRemainingDays();

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        membershipTier: user.membershipTier,
        membershipStatus: user.membershipStatus,
        membershipExpiryDate: user.membershipExpiryDate,
        emergencyContact: user.emergencyContact,
        remainingDays,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching profile.',
      error: error.message
    });
  }
};

// POST /api/auth/logout
const logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy((destroyErr) => {
      res.clearCookie('connect.sid');
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully.'
      });
    });
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout
};
