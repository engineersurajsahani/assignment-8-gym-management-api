const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { username, email, password, membershipTier, durationMonths, emergencyContact } = req.body;
    
    if (!username || !email || !password || !durationMonths) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + Number(durationMonths));

    const user = new User({
      username,
      email,
      password: hashedPassword,
      membershipTier,
      membershipExpiryDate: expiryDate,
      emergencyContact
    });

    await user.save();
    res.status(201).json({ message: 'Registration successful', userId: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const now = new Date();
    if (user.membershipExpiryDate < now && user.membershipStatus === 'active') {
      user.membershipStatus = 'expired';
      await user.save();
    }
    
    const remainingDays = Math.max(0, Math.ceil((user.membershipExpiryDate - now) / (1000 * 60 * 60 * 24)));
    
    res.json({
      user,
      remainingDays
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
