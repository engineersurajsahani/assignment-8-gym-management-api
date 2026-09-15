const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');

const VALID_TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum'];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { username, email, password, membershipTier, durationMonths, emergencyContact } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'username, email and password are required'
      });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    if (membershipTier && !VALID_TIERS.includes(membershipTier)) {
      return res.status(400).json({
        success: false,
        message: `membershipTier must be one of: ${VALID_TIERS.join(', ')}`
      });
    }

    const months = durationMonths !== undefined ? Number(durationMonths) : 1;
    if (!Number.isFinite(months) || months <= 0) {
      return res.status(400).json({ success: false, message: 'durationMonths must be a positive number' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const membershipExpiryDate = addMonths(new Date(), months);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      membershipTier: membershipTier || 'Bronze',
      membershipExpiryDate,
      emergencyContact
    });

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.status(201).json({
      success: true,
      message: 'Member registered successfully',
      data: safeUser
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/auth/login — delegates to Passport's local strategy
 */
function login(req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!user) {
      return res.status(401).json({ success: false, message: info?.message || 'Invalid credentials' });
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return res.status(500).json({ success: false, message: loginErr.message });
      }
      const safeUser = user.toObject();
      delete safeUser.password;
      return res.status(200).json({ success: true, message: 'Login successful', data: safeUser });
    });
  })(req, res, next);
}

/**
 * POST /api/auth/logout
 */
function logout(req, res, next) {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      return res.status(200).json({ success: true, message: 'Logged out successfully' });
    });
  });
}

/**
 * GET /api/auth/me — profile & remaining membership days
 */
async function me(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const safeUser = user.toObject();
    delete safeUser.password;

    const msRemaining = user.membershipExpiryDate.getTime() - Date.now();
    const remainingDays = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

    return res.status(200).json({
      success: true,
      data: { ...safeUser, remainingDays }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { register, login, logout, me };
