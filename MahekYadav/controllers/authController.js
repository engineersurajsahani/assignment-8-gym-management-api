const bcrypt = require('bcryptjs');
const User = require('../models/User');

const register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      membershipTier,
      durationMonths,
      emergencyContact
    } = req.body;

    if (!username || !email || !password || !durationMonths) {
      return res.status(400).json({
        message: 'username, email, password and durationMonths are required'
      });
    }

    if (!Number.isInteger(Number(durationMonths)) || Number(durationMonths) <= 0) {
      return res.status(400).json({ message: 'durationMonths must be a positive integer' });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email: email.toLowerCase() }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // The assignment asks for 30 days per month.
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + Number(durationMonths) * 30);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      membershipTier: membershipTier || 'Bronze',
      membershipStatus: 'active',
      membershipExpiryDate: expiryDate,
      emergencyContact
    });

    return res.status(201).json({
      message: 'Member registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        membershipTier: user.membershipTier,
        membershipStatus: user.membershipStatus,
        membershipExpiryDate: user.membershipExpiryDate,
        emergencyContact: user.emergencyContact
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

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

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const now = new Date();
    const expiry = new Date(user.membershipExpiryDate);
    const remainingDays = Math.max(
      0,
      Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
    );

    if (remainingDays === 0 && user.membershipStatus === 'active') {
      user.membershipStatus = 'expired';
      await user.save();
    }

    return res.status(200).json({
      user,
      remainingDays
    });
  } catch (error) {
    return res.status(500).json({ message: 'Could not fetch profile', error: error.message });
  }
};

module.exports = { register, login, getMe };
