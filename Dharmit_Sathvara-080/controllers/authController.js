const User = require('../models/User');

const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, membershipTier = 'Bronze', durationMonths = 1, emergencyContact } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email and password are required' });
    }

    const months = Number(durationMonths);
    if (!Number.isInteger(months) || months < 1) {
      return res.status(400).json({ message: 'durationMonths must be a positive integer' });
    }

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const expiryDate = addMonths(new Date(), months);
    const user = await User.create({
      username,
      email,
      password,
      membershipTier,
      membershipStatus: 'active',
      membershipExpiryDate: expiryDate,
      emergencyContact
    });

    req.login(user, (error) => {
      if (error) return res.status(500).json({ message: 'Registration succeeded but login failed' });
      return res.status(201).json({
        message: 'Member registered successfully',
        user: user.toSafeObject(),
        membershipExpiryDate: expiryDate
      });
    });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

exports.login = (req, res) => {
  res.status(200).json({ message: 'Login successful', user: req.user.toSafeObject() });
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const now = new Date();
    const expiry = new Date(user.membershipExpiryDate);
    const remainingDays = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));

    if (expiry < now && user.membershipStatus === 'active') {
      user.membershipStatus = 'expired';
      await user.save();
    }

    res.status(200).json({
      user: user.toSafeObject(),
      remainingDays: user.membershipStatus === 'expired' ? 0 : remainingDays
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch profile', error: error.message });
  }
};

exports.logout = (req, res, next) => {
  req.logout((error) => {
    if (error) return next(error);
    req.session.destroy((sessionError) => {
      if (sessionError) return next(sessionError);
      res.clearCookie('connect.sid');
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });
};
