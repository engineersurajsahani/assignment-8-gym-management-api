const passport = require('passport');
const User = require('../models/User');

// Register new member with chosen membership plan and auto expiry calculation
const register = async (req, res) => {
  try {
    const { username, email, password, membershipTier, durationMonths, emergencyContact } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    // Check if user or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists.' });
    }

    // Calculate membership expiry date based on durationMonths (default to 1 month)
    const months = parseInt(durationMonths) > 0 ? parseInt(durationMonths) : 1;
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);

    const newUser = new User({
      username,
      email,
      password,
      membershipTier: membershipTier || 'Bronze',
      membershipStatus: 'active',
      membershipExpiryDate: expiryDate,
      emergencyContact
    });

    await newUser.save();

    const userObj = newUser.toObject();
    delete userObj.password;

    return res.status(201).json({
      message: 'Member registered successfully.',
      user: userObj
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Login user using Passport Local strategy
const login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(401).json({ error: info ? info.message : 'Invalid credentials' });
    }
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const userObj = user.toObject ? user.toObject() : user;
      delete userObj.password;

      return res.status(200).json({
        message: 'Logged in successfully.',
        user: userObj
      });
    });
  })(req, res, next);
};

// Fetch active member profile & remaining days
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const now = new Date();
    const expiry = new Date(user.membershipExpiryDate);
    const diffTime = expiry - now;
    const remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Auto update status if expired
    if (expiry < now && user.membershipStatus === 'active') {
      user.membershipStatus = 'expired';
      await user.save();
    }

    return res.status(200).json({
      user,
      remainingDays
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Logout user
const logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: 'Logged out successfully.' });
    });
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout
};
