const express = require("express");
const FitnessClass = require("../model/FitnessClass");
const isAuthenticated = require("../middleware/authMiddleware");
const checkActiveMember = require("../middleware/checkActiveMember");

const router = express.Router();

/**
 * @route GET /api/classes
 * @desc Get all upcoming fitness classes (supports filtering by trainer)
 * @access Public
 */
router.get("/", async (req, res) => {
  try {
    const { trainer } = req.query;
    
    // Base query: Only return classes scheduled in the future
    let query = {
      scheduleDate: { $gte: new Date() }
    };

    // Filter by trainer if provided
    if (trainer) {
      query.trainerName = { $regex: new RegExp(trainer, "i") };
    }

    const classes = await FitnessClass.find(query)
      .populate("enrolledMembers", "username email membershipTier") // Don't return password
      .sort({ scheduleDate: 1 });

    res.status(200).json({
      success: true,
      message: "Upcoming classes fetched successfully",
      data: classes
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
 * @route GET /api/classes/:id
 * @desc Get single class details
 * @access Public
 */
router.get("/:id", async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id)
      .populate("enrolledMembers", "username email membershipTier");

    if (!fitnessClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Class details fetched successfully",
      data: fitnessClass
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
 * @route POST /api/classes
 * @desc Create a new fitness class
 * @access Public (could be protected in real world for admins only)
 */
router.post("/", async (req, res) => {
  try {
    const { title, trainerName, scheduleDate, durationMinutes, maxCapacity } = req.body;

    // Validate required fields
    if (!title || !trainerName || !scheduleDate || !maxCapacity) {
      return res.status(400).json({
        success: false,
        message: "Please provide title, trainerName, scheduleDate, and maxCapacity"
      });
    }

    if (maxCapacity < 1) {
      return res.status(400).json({
        success: false,
        message: "Capacity must be at least 1"
      });
    }

    const newClass = new FitnessClass({
      title,
      trainerName,
      scheduleDate,
      durationMinutes: durationMinutes || 60,
      maxCapacity
    });

    await newClass.save();

    res.status(201).json({
      success: true,
      message: "Fitness class created successfully",
      data: newClass
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
 * @route POST /api/classes/:id/book
 * @desc Book a fitness class
 * @access Private (Requires Active Membership)
 */
router.post("/:id/book", isAuthenticated, checkActiveMember, async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);

    if (!fitnessClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    // Check if class is full
    if (fitnessClass.enrolledMembers.length >= fitnessClass.maxCapacity) {
      return res.status(400).json({
        success: false,
        message: "Class capacity reached"
      });
    }

    // Check if user is already enrolled
    const isEnrolled = fitnessClass.enrolledMembers.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (isEnrolled) {
      return res.status(400).json({
        success: false,
        message: "You are already booked for this class"
      });
    }

    // Add user to class
    fitnessClass.enrolledMembers.push(req.user._id);
    await fitnessClass.save();

    // Fetch populated class for response
    const populatedClass = await FitnessClass.findById(req.params.id)
      .populate("enrolledMembers", "username email membershipTier");

    res.status(200).json({
      success: true,
      message: "Successfully booked the class",
      data: populatedClass
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
 * @route DELETE /api/classes/:id/cancel
 * @desc Cancel a class booking
 * @access Private
 */
router.delete("/:id/cancel", isAuthenticated, async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);

    if (!fitnessClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    // Check if user is enrolled
    const isEnrolled = fitnessClass.enrolledMembers.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (!isEnrolled) {
      return res.status(400).json({
        success: false,
        message: "You are not enrolled in this class"
      });
    }

    // Remove user from enrolledMembers
    fitnessClass.enrolledMembers = fitnessClass.enrolledMembers.filter(
      (memberId) => memberId.toString() !== req.user._id.toString()
    );

    await fitnessClass.save();

    res.status(200).json({
      success: true,
      message: "Class booking cancelled successfully",
      data: fitnessClass
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message
    });
  }
});

module.exports = router;
