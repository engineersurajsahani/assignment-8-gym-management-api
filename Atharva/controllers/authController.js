const User = require('../models/User');
const bcrypt = require('bcryptjs');
const passport = require('passport');

exports.register = async (req, res) => {
  try {
    const { username, email, password, membershipTier, durationMonths } = req.body;
    
    if (!username || !email || !password || !durationMonths) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + parseInt(durationMonths));

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      membershipTier: membershipTier || 'Bronze',
      membershipExpiryDate: expiryDate
    });

    await newUser.save();

    res.status(201).json({ success: true, message: 'User registered successfully', userId: newUser._id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ success: false, message: info.message || 'Login failed' });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      res.status(200).json({ success: true, message: 'Logged in successfully', user: { id: user._id, username: user.username } });
    });
  })(req, res, next);
};

exports.getMe = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  
  const user = req.user.toObject();
  delete user.password;
  
  // Calculate remaining days
  const now = new Date();
  const expiry = new Date(user.membershipExpiryDate);
  const diffTime = expiry - now;
  const remainingDays = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;

  res.status(200).json({ success: true, data: { ...user, remainingDays } });
};
