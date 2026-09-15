const passport = require('passport');
const User = require('../models/User');

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, password, membershipTier, durationMonths } = req.body;

    if (!username || !email || !password || !durationMonths) {
      return res.status(400).json({ message: 'username, email, password, and durationMonths are required.' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already in use.' });
    }

    const membershipExpiryDate = new Date();
    membershipExpiryDate.setMonth(membershipExpiryDate.getMonth() + Number(durationMonths));

    const newUser = new User({
      username,
      email,
      password,
      membershipTier: membershipTier || 'Bronze',
      membershipExpiryDate
    });

    await newUser.save();

    res.status(201).json({
      message: 'Member registered successfully.',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        membershipTier: newUser.membershipTier,
        membershipExpiryDate: newUser.membershipExpiryDate
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// POST /api/auth/login
const login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info?.message || 'Login failed.' });

    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.status(200).json({
        message: 'Logged in successfully.',
        user: { id: user._id, username: user.username, membershipTier: user.membershipTier }
      });
    });
  })(req, res, next);
};

// GET /api/auth/me
const getProfile = (req, res) => {
  const user = req.user;
  const remainingDays = Math.ceil((user.membershipExpiryDate - new Date()) / (1000 * 60 * 60 * 24));

  res.status(200).json({
    id: user._id,
    username: user.username,
    email: user.email,
    membershipTier: user.membershipTier,
    membershipStatus: user.membershipStatus,
    membershipExpiryDate: user.membershipExpiryDate,
    remainingDays: remainingDays > 0 ? remainingDays : 0
  });
};

module.exports = { register, login, getProfile };