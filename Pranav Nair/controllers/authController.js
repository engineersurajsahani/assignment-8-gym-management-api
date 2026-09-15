const bcrypt = require('bcryptjs');
const User = require('../models/User');
const passport = require('passport');

/**
 * POST /api/auth/register
 * Register a new member with membership plan and auto-calculated expiry.
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password, membershipTier, durationMonths } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'username, email and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Check for existing user
    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Calculate expiry date: durationMonths defaults to 1
    const months = (durationMonths && durationMonths > 0) ? durationMonths : 1;
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      membershipTier: membershipTier || 'Bronze',
      membershipStatus: 'active',
      membershipExpiryDate: expiryDate,
      emergencyContact: req.body.emergencyContact || undefined,
    });

    return res.status(201).json({
      success: true,
      message: 'Member registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        membershipTier: user.membershipTier,
        membershipStatus: user.membershipStatus,
        membershipExpiryDate: user.membershipExpiryDate,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Login via Passport Local. Creates a session.
 */
const login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || 'Invalid username or password',
      });
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) return next(loginErr);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          membershipTier: user.membershipTier,
          membershipStatus: user.membershipStatus,
          membershipExpiryDate: user.membershipExpiryDate,
        },
      });
    });
  })(req, res, next);
};

/**
 * GET /api/auth/me
 * Returns the currently logged-in member's profile with remaining days.
 */
const me = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Member not found',
    });
  }

  // Auto-expire if past expiry
  if (user.membershipStatus === 'active' && user.membershipExpiryDate < new Date()) {
    user.membershipStatus = 'expired';
    await user.save();
  }

  const now = new Date();
  const remainingMs = user.membershipExpiryDate - now;
  const remainingDays = remainingMs > 0 ? Math.ceil(remainingMs / (1000 * 60 * 60 * 24)) : 0;

  return res.status(200).json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      membershipTier: user.membershipTier,
      membershipStatus: user.membershipStatus,
      membershipExpiryDate: user.membershipExpiryDate,
      remainingDays,
      emergencyContact: user.emergencyContact,
    },
  });
};

module.exports = { register, login, me };
