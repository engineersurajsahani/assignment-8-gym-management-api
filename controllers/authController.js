const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Register a new member
const register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      membershipTier,
      durationMonths
    } = req.body;

    if (!username || !email || !password || !durationMonths) {
      return res.status(400).json({
        message: 'Username, email, password and durationMonths are required'
      });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Username or email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const expiryDate = new Date();
    expiryDate.setDate(
      expiryDate.getDate() + Number(durationMonths) * 30
    );

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      membershipTier: membershipTier || 'Bronze',
      membershipStatus: 'active',
      membershipExpiryDate: expiryDate
    });

    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({
          message: 'Login after registration failed'
        });
      }

      res.status(201).json({
        message: 'Member registered successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          membershipTier: user.membershipTier,
          membershipStatus: user.membershipStatus,
          membershipExpiryDate: user.membershipExpiryDate
        }
      });
    });
  } catch (error) {
    res.status(500).json({
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Login
const login = (req, res) => {
  res.status(200).json({
    message: 'Login successful',
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      membershipTier: req.user.membershipTier,
      membershipStatus: req.user.membershipStatus,
      membershipExpiryDate: req.user.membershipExpiryDate
    }
  });
};

// Get current logged-in member
const getMe = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Not authenticated'
    });
  }

  res.status(200).json({
    id: req.user._id,
    username: req.user.username,
    email: req.user.email,
    membershipTier: req.user.membershipTier,
    membershipStatus: req.user.membershipStatus,
    membershipExpiryDate: req.user.membershipExpiryDate,
    emergencyContact: req.user.emergencyContact
  });
};

// Logout
const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        message: 'Logout failed'
      });
    }

    req.session.destroy((sessionError) => {
      if (sessionError) {
        return res.status(500).json({
          message: 'Session destruction failed'
        });
      }

      res.status(200).json({
        message: 'Logout successful'
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