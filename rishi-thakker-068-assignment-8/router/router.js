const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const FitnessClass = require("../models/FitnessClass");

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, membershipTier, durationMonths, emergencyContact } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const months = Number(durationMonths) > 0 ? Number(durationMonths) : 1;
    const membershipExpiryDate = new Date();
    membershipExpiryDate.setMonth(membershipExpiryDate.getMonth() + months);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      membershipTier,
      membershipExpiryDate,
      emergencyContact,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        membershipTier: user.membershipTier,
        membershipExpiryDate: user.membershipExpiryDate,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      "itm",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const daysRemaining = Math.ceil(
      (new Date(user.membershipExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    res.status(200).json({ ...user.toObject(), daysRemaining });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/classes", async (req, res) => {
  try {
    const filter = { scheduleDate: { $gte: new Date() } };

    if (req.query.trainer) {
      filter.trainerName = { $regex: req.query.trainer, $options: "i" };
    }

    const classes = await FitnessClass.find(filter).sort({ scheduleDate: 1 });
    res.status(200).json(classes);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/classes/:id", async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id).populate(
      "enrolledMembers",
      "username email membershipTier membershipStatus"
    );

    if (!fitnessClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json(fitnessClass);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/classes", authMiddleware, async (req, res) => {
  try {
    const { title, trainerName, scheduleDate, durationMinutes, maxCapacity } = req.body;

    if (!title || !trainerName || !scheduleDate || !maxCapacity) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const fitnessClass = await FitnessClass.create({
      title,
      trainerName,
      scheduleDate,
      durationMinutes,
      maxCapacity,
    });

    res.status(201).json(fitnessClass);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/classes/:id/book", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isExpired =
      user.membershipStatus === "expired" ||
      new Date(user.membershipExpiryDate) < new Date();

    if (isExpired) {
      return res.status(400).json({ message: "Your membership has expired" });
    }

    const fitnessClass = await FitnessClass.findById(req.params.id);
    if (!fitnessClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    const alreadyBooked = fitnessClass.enrolledMembers.some(
      (memberId) => memberId.toString() === req.user.id
    );
    if (alreadyBooked) {
      return res.status(400).json({ message: "You are already booked into this class" });
    }

    if (fitnessClass.enrolledMembers.length >= fitnessClass.maxCapacity) {
      return res.status(400).json({ message: "Class capacity reached" });
    }

    fitnessClass.enrolledMembers.push(req.user.id);
    await fitnessClass.save();

    res.status(200).json({ message: "Successfully booked into class", fitnessClass });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.delete("/classes/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);
    if (!fitnessClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    const wasBooked = fitnessClass.enrolledMembers.some(
      (memberId) => memberId.toString() === req.user.id
    );
    if (!wasBooked) {
      return res.status(400).json({ message: "You are not booked into this class" });
    }

    fitnessClass.enrolledMembers = fitnessClass.enrolledMembers.filter(
      (memberId) => memberId.toString() !== req.user.id
    );
    await fitnessClass.save();

    res.status(200).json({ message: "Booking cancelled successfully", fitnessClass });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.patch("/members/:id/renew", authMiddleware, async (req, res) => {
  try {
    const { additionalMonths, tier } = req.body;

    if (!additionalMonths || Number(additionalMonths) <= 0) {
      return res.status(400).json({ message: "additionalMonths must be a positive number" });
    }

    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    const baseDate =
      member.membershipExpiryDate && new Date(member.membershipExpiryDate) > new Date()
        ? new Date(member.membershipExpiryDate)
        : new Date();

    baseDate.setMonth(baseDate.getMonth() + Number(additionalMonths));
    member.membershipExpiryDate = baseDate;
    member.membershipStatus = "active";

    if (tier) {
      member.membershipTier = tier;
    }

    await member.save();

    res.status(200).json({
      message: "Membership renewed successfully",
      member: {
        id: member._id,
        membershipTier: member.membershipTier,
        membershipStatus: member.membershipStatus,
        membershipExpiryDate: member.membershipExpiryDate,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/members/expired", authMiddleware, async (req, res) => {
  try {
    await User.updateMany(
      { membershipExpiryDate: { $lt: new Date() }, membershipStatus: { $ne: "expired" } },
      { $set: { membershipStatus: "expired" } }
    );

    const expiredMembers = await User.find({
      membershipExpiryDate: { $lt: new Date() },
    })
      .select("-password")
      .sort({ membershipExpiryDate: 1 });

    res.status(200).json(expiredMembers);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;