const bcrypt = require('bcryptjs');
const User = require('../models/User');

const VALID_TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum'];

// ------------------------------------------------------------------
// getSafeUser
// Small shared helper that strips the password hash (and internal
// membershipDurationMonths field) before a user is sent to the client.
// Never return passwords to API consumers.
// ------------------------------------------------------------------
const getSafeUser = (user) => ({
  id: user._id.toString(),
  username: user.username,
  email: user.email,
  membershipTier: user.membershipTier,
  membershipStatus: user.membershipStatus,
  membershipExpiryDate: user.membershipExpiryDate,
  emergencyContact: user.emergencyContact || null
});

module.exports = { getSafeUser };

// ------------------------------------------------------------------
// POST /api/auth/register
// Body: { username, email, password, membershipTier, durationMonths }
// ------------------------------------------------------------------
const register = async (req, res) => {
  try {
    const { username, email, password, membershipTier, durationMonths } = req.body;

    // ---- 1-5. Input validation -------------------------------------
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return res.status(400).json({ message: 'Username is required' });
    }
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'A valid email address is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (membershipTier && !VALID_TIERS.includes(membershipTier)) {
      return res.status(400).json({
        message: `membershipTier must be one of: ${VALID_TIERS.join(', ')}`
      });
    }
    const months = Number(durationMonths);
    if (!months || months < 1 || !Number.isInteger(months)) {
      return res.status(400).json({ message: 'durationMonths must be a positive integer' });
    }

    // ---- 6-7. Duplicate checks -------------------------------------
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });
    if (existingUser) {
      const field = existingUser.username === username ? 'Username' : 'Email';
      return res.status(400).json({ message: `${field} already taken` });
    }

    // ---- 8. Hash the password --------------------------------------
    const hashedPassword = await bcrypt.hash(password, 10);

    // ---- 9-10. Create the user -------------------------------------
    // The membershipExpiryDate is calculated automatically by the
    // pre('save') hook inside models/User.js (durationMonths * 30 days).
    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      membershipTier: membershipTier || 'Bronze',
      membershipDurationMonths: months
    });

    // ---- 11. Return safe user --------------------------------------
    return res.status(201).json({
      message: 'Member registered successfully',
      user: getSafeUser(user)
    });
  } catch (error) {
    // Handle duplicate key errors that may slip through as a race.
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username or email already taken' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

// ------------------------------------------------------------------
// POST /api/auth/login
// Passport Local Strategy handles the actual authentication
// (see config/passport.js). This controller runs only after a
// successful login and returns the session user.
// ------------------------------------------------------------------
const login = (req, res) => {
  return res.status(200).json({
    message: 'Login successful',
    user: getSafeUser(req.user)
  });
};

// ------------------------------------------------------------------
// GET /api/auth/me
// Returns the logged-in member plus the dynamically-calculated
// remaining membership days. remainingDays is never stored in MongoDB.
// ------------------------------------------------------------------
const getMe = async (req, res) => {
  try {
    const user = req.user;

    // Keep the stored status in sync with reality.
    if (user.membershipExpiryDate < new Date() && user.membershipStatus !== 'expired') {
      user.membershipStatus = 'expired';
      await user.save();
    }

    const remainingDays = Math.max(
      0,
      Math.ceil((user.membershipExpiryDate - new Date()) / (1000 * 60 * 60 * 24))
    );

    return res.status(200).json({
      user: getSafeUser(user),
      remainingDays
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// ------------------------------------------------------------------
// POST /api/auth/logout
// Destroys the Passport session so protected endpoints return 401.
// ------------------------------------------------------------------
const logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((destroyErr) => {
      if (destroyErr) return next(destroyErr);
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: 'Logout successful' });
    });
  });
};

module.exports = { register, login, getMe, logout, getSafeUser };