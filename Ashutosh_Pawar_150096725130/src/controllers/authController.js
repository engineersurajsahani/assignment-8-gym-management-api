const bcrypt = require("bcryptjs");
const User = require("../models/User");
const passport = require("passport");

const registerUser = async (request, response) => {
  try {
    const { username, email, password, membershipTier, emergencyContact } =
      request.body;
    if (!username) {
      return response.status(400).json({ message: "Please enter a username!" });
    } else if (!password) {
      return response.status(400).json({ message: "Please enter a password!" });
    } else if (!email) {
      return response
        .status(400)
        .json({ message: "Please enter an email id!!!" });
    } else if (!membershipTier) {
      return response
        .status(400)
        .json({ message: "Please choose a membership tier!" });
    } else if (!emergencyContact) {
      return response
        .status(400)
        .json({ message: "Please enter an emergency contact!" });
    }

    if (password.length < 6) {
      return response
        .status(400)
        .json({ message: "password must be at least 6 characters!" });
    }

    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      return response
        .status(409)
        .json({ message: "This username already exists!!!" });
    }

    const existingEmail = await User.findOne({ email: email });
    if (existingEmail) {
      return response.status(409).json({
        message: "This email is already a part of another username!!!",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const months = Number(request.body.durationMonths ?? 1);
    if (!Number.isInteger(months) || months < 1 || months > 24) {
      return response
        .status(400)
        .json({ message: "durationMonths must be a whole number from 1 to 24!" });
    }
    const membershipExpiryDate = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);

    const user = await User.create({
      username,
      email,
      password: hashPassword,
      membershipTier,
      membershipExpiryDate,
      emergencyContact,
    });

    return response.status(201).json({
      message: "user createdddd!!!",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
};

const loginUser = async (request, response) => {
  try {
    if (!request.body.username && request.body.email) {
      request.body.username = request.body.email;
    }
    if (!request.body.username || !request.body.password) {
      return response
        .status(400)
        .json({ message: "Please enter username and password!" });
    }

    passport.authenticate("local", (error, user, info) => {
      if (error) {
        return response.status(500).json({ message: error.message });
      }
      if (!user) {
        return response
          .status(401)
          .json({ message: info?.message || "Invalid credentials!" });
      }
      request.login(user, (loginError) => {
        if (loginError) {
          return response.status(500).json({ message: loginError.message });
        }
        return response.status(200).json({ message: "Login successful", user });
      });
    })(request, response);
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
};

const getMe = async (request, response) => {
  try {
    const user = request.user;
    if (user.membershipStatus === "active" && user.isExpired()) {
      await user.save();
    }
    return response.status(200).json({
      user,
      remainingDays: user.remainingDays,
    });
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
};

const logoutUser = (request, response) => {
  request.logout((error) => {
    if (error) {
      return response.status(500).json({ message: error.message });
    }
    request.session.destroy(() => {
      response.clearCookie("connect.sid");
      return response.status(200).json({ message: "Logged out" });
    });
  });
};

module.exports = { registerUser, loginUser, getMe, logoutUser };
