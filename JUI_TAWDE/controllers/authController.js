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
        message: 'Username, email and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long.',
      });
    }

    const months = Number(durationMonths || 1);

    if (!Number.isInteger(months) || months < 1) {
      return res.status(400).json({
        message: 'durationMonths must be a positive integer.',
      });
    }

    const existingUsername = await User.findOne({
      username,
    });

    if (existingUsername) {
      return res.status(409).json({
        message: 'Username already exists.',
      });
    }

    const existingEmail = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingEmail) {
      return res.status(409).json({
        message: 'Email already exists.',
      });
    }

    /*
      membershipExpiryDate is NOT calculated here.

      The Mongoose pre-save hook in User.js
      automatically calculates it.
    */
    const user = new User({
      username,
      email,
      password,
      membershipTier: membershipTier || 'Bronze',
      membershipDurationMonths: months,
      membershipStatus: 'active',
      emergencyContact,
    });

    await user.save();

    res.status(201).json({
      message: 'Member registered successfully.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        membershipTier: user.membershipTier,
        membershipStatus: user.membershipStatus,
        membershipExpiryDate: user.membershipExpiryDate,
        emergencyContact: user.emergencyContact,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);

    res.status(500).json({
      message: 'Registration failed.',
      error: error.message,
    });
  }
};

const login = (req, res) => {
  res.status(200).json({
    message: 'Login successful.',
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      membershipTier: req.user.membershipTier,
      membershipStatus: req.user.membershipStatus,
      membershipExpiryDate: req.user.membershipExpiryDate,
    },
  });
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    // Keep membership status updated
    if (
      user.membershipExpiryDate &&
      user.membershipExpiryDate < new Date() &&
      user.membershipStatus === 'active'
    ) {
      user.membershipStatus = 'expired';
      await user.save();
    }

    const now = new Date();

    const remainingMilliseconds =
      user.membershipExpiryDate.getTime() - now.getTime();

    const remainingDays = Math.max(
      0,
      Math.ceil(
        remainingMilliseconds /
          (1000 * 60 * 60 * 24)
      )
    );

    res.status(200).json({
      user,
      remainingDays,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch profile.',
      error: error.message,
    });
  }
};

const logout = (req, res) => {
  req.logout((error) => {
    if (error) {
      return res.status(500).json({
        message: 'Logout failed.',
      });
    }

    req.session.destroy((sessionError) => {
      if (sessionError) {
        return res.status(500).json({
          message: 'Failed to destroy session.',
        });
      }

      res.clearCookie('connect.sid');

      return res.status(200).json({
        message: 'Logout successful.',
      });
    });
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};