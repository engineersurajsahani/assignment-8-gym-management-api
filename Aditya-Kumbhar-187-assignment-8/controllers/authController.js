const bcrypt = require("bcryptjs");
const passport = require("passport");
const User = require("../models/User");

// register a new member
exports.register = async (req, res) => {
  try {
    const { username, email, password, membershipTier, durationMonths } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please fill all the required fields" });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: "Username or email already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      membershipTier: membershipTier || "Bronze",
    });

    // used by the pre-validate hook in the User model to calculate expiry date
    newUser.durationMonths = durationMonths || 1;

    await newUser.save();

    res.status(201).json({
      message: "Member registered successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        membershipTier: newUser.membershipTier,
        membershipExpiryDate: newUser.membershipExpiryDate,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Something went wrong", error: err.message });
  }
};

// login with passport local strategy
exports.login = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(400).json({ message: "Error while logging in" });
    }
    if (!user) {
      return res.status(401).json({ message: info ? info.message : "Invalid credentials" });
    }

    req.logIn(user, (err) => {
      if (err) {
        return res.status(400).json({ message: "Error while logging in" });
      }
      res.status(200).json({ message: "Logged in successfully", username: user.username });
    });
  })(req, res, next);
};

// get logged in members profile + days left on membership
exports.getProfile = (req, res) => {
  const user = req.user;
  const today = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLeft = Math.ceil((user.membershipExpiryDate - today) / msPerDay);

  res.status(200).json({
    username: user.username,
    email: user.email,
    membershipTier: user.membershipTier,
    membershipStatus: user.membershipStatus,
    membershipExpiryDate: user.membershipExpiryDate,
    daysLeft: daysLeft,
  });
};

// logout of session
exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(400).json({ message: "Error while logging out" });
    }
    res.status(200).json({ message: "Logged out successfully" });
  });
};
