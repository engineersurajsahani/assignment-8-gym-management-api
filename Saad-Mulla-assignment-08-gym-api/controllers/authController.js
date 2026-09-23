const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { username, email, password, membershipTier, emergencyContact, months } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const durationMonths = months || 1;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (30 * durationMonths));

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      membershipTier: membershipTier || 'Bronze',
      membershipExpiryDate: expiryDate,
      emergencyContact
    });

    await newUser.save();
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({ message: 'User registered successfully', user: userResponse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(400).json({ error: info ? info.message : 'Invalid credentials' });

    req.logIn(user, (err) => {
      if (err) return next(err);
      const userResponse = user.toObject();
      delete userResponse.password;
      return res.json({ message: 'Login successful', user: userResponse });
    });
  })(req, res, next);
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const now = new Date();
    const expiry = new Date(user.membershipExpiryDate);
    const diffTime = expiry - now;
    const remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    res.json({
      user,
      remainingDays,
      isExpired: diffTime < 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};