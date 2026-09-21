const bcrypt = require("bcryptjs");
const User = require("../models/User");

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

    const membershipExpiryDate = new Date();
    membershipExpiryDate.setMonth(membershipExpiryDate.getMonth() + 1);

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

module.exports = { registerUser };
