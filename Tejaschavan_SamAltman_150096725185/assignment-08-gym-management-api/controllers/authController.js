const passport = require('passport');
const User = require('../models/User');

/**
 * Accurately add months to a given date handling month-end edge cases
 * e.g., Jan 31 + 1 month -> Feb 28 (or 29 in leap year)
 */
const addMonths = (startDate, months) => {
  const date = new Date(startDate);
  const targetMonth = date.getMonth() + Number(months);
  const originalDay = date.getDate();
  date.setMonth(targetMonth);
  if (date.getDate() !== originalDay) {
    date.setDate(0);
  }
  return date;
};

// @desc    Register a new member
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password, membershipTier, durationMonths, emergencyContact } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password'
      });
    }

    const months = parseInt(durationMonths, 10);
    if (isNaN(months) || months < 1) {
      return res.status(400).json({
        success: false,
        message: 'durationMonths is required and must be an integer greater than or equal to 1'
      });
    }

    // Check if user with username or email already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Username';
      return res.status(400).json({
        success: false,
        message: `${field} is already registered`
      });
    }

    // Calculate expiry date as now + durationMonths
    const membershipExpiryDate = addMonths(new Date(), months);

    const user = new User({
      username,
      email: email.toLowerCase(),
      password,
      membershipTier: membershipTier || 'Bronze',
      membershipStatus: 'active',
      membershipExpiryDate,
      emergencyContact: emergencyContact || ''
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

// @desc    Login member
// @route   POST /api/auth/login
// @access  Public
exports.login = (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide username and password'
    });
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Authentication error'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || 'Invalid username or password'
      });
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        return res.status(500).json({
          success: false,
          message: loginErr.message || 'Session login error'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: user
      });
    });
  })(req, res, next);
};

// @desc    Logout current member session
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error during logout'
      });
    }
    req.session.destroy((sessionErr) => {
      res.clearCookie('connect.sid');
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  });
};

// @desc    Get current logged in user profile with remaining days
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const now = new Date();
    const expiry = new Date(user.membershipExpiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const userData = user.toJSON();
    userData.remainingDays = remainingDays;

    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user profile'
    });
  }
};
