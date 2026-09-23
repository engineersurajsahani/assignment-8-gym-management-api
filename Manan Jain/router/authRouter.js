const express = require("express");
const passport = require("passport");
const User = require("../model/User");
const isAuthenticated = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new member
 * @access Public
 */
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, membershipTier, durationMonths, emergencyContact } = req.body;

    // Validate required fields
    if (!username || !email || !password || !durationMonths) {
      return res.status(400).json({
        success: false,
        message: "Please provide username, email, password, and durationMonths"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username or email already exists"
      });
    }

    // Calculate membership expiry date
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + parseInt(durationMonths));

    // Create new user
    const newUser = new User({
      username,
      email,
      password, // Password will be hashed by pre-save hook
      membershipTier: membershipTier || "Bronze",
      membershipExpiryDate: expiryDate,
      emergencyContact: emergencyContact || ""
    });

    // Save user to DB
    await newUser.save();

    // Prepare user object to return (exclude password)
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "Member registered successfully",
      data: userResponse
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message
    });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login member & create session
 * @access Public
 */
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
    if (!user) {
      return res.status(401).json({ success: false, message: info.message || "Invalid credentials" });
    }
    
    // Log in the user (establishes session)
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Login failed" });
      }

      const userResponse = user.toObject();
      delete userResponse.password;

      return res.status(200).json({
        success: true,
        message: "Logged in successfully",
        data: userResponse
      });
    });
  })(req, res, next);
});

/**
 * @route POST /api/auth/logout
 * @desc Logout member & destroy session
 * @access Private
 */
router.post("/logout", isAuthenticated, (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Logout failed" });
    }
    
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Session destruction failed" });
      }
      res.clearCookie("connect.sid"); // default cookie name for express-session
      res.status(200).json({
        success: true,
        message: "Logged out successfully"
      });
    });
  });
});

/**
 * @route GET /api/auth/me
 * @desc Get current logged in member's profile
 * @access Private
 */
router.get("/me", isAuthenticated, (req, res) => {
  const user = req.user.toObject();
  
  // Calculate remaining membership days
  const now = new Date();
  const expiry = new Date(user.membershipExpiryDate);
  const diffTime = expiry - now;
  
  let remainingDays = 0;
  if (diffTime > 0) {
    remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Remove password from response
  delete user.password;

  res.status(200).json({
    success: true,
    message: "Current user profile fetched successfully",
    data: {
      ...user,
      remainingDays
    }
  });
});

module.exports = router;
