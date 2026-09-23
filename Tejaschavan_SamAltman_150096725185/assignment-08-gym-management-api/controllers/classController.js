const mongoose = require('mongoose');
const FitnessClass = require('../models/FitnessClass');
const User = require('../models/User');

// @desc    Create a new fitness class
// @route   POST /api/classes
// @access  Private / Public
exports.createClass = async (req, res) => {
  try {
    const { title, trainerName, scheduleDate, durationMinutes, maxCapacity } = req.body;

    if (!title || !trainerName || !scheduleDate || maxCapacity === undefined || maxCapacity === null) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, trainerName, scheduleDate, and maxCapacity'
      });
    }

    const parsedCapacity = parseInt(maxCapacity, 10);
    if (isNaN(parsedCapacity) || parsedCapacity < 1) {
      return res.status(400).json({
        success: false,
        message: 'maxCapacity must be an integer of at least 1'
      });
    }

    const parsedDate = new Date(scheduleDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid scheduleDate format'
      });
    }

    const fitnessClass = new FitnessClass({
      title,
      trainerName,
      scheduleDate: parsedDate,
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 60,
      maxCapacity: parsedCapacity,
      enrolledMembers: []
    });

    await fitnessClass.save();

    res.status(201).json({
      success: true,
      message: 'Fitness class created successfully',
      data: fitnessClass
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating fitness class'
    });
  }
};

// @desc    Get all upcoming fitness classes with optional trainer filter
// @route   GET /api/classes
// @access  Public
exports.getClasses = async (req, res) => {
  try {
    const { trainer } = req.query;
    const filter = {
      scheduleDate: { $gte: new Date() }
    };

    if (trainer) {
      filter.trainerName = { $regex: new RegExp(trainer.trim(), 'i') };
    }

    const classes = await FitnessClass.find(filter)
      .sort({ scheduleDate: 1 })
      .populate('enrolledMembers', 'username email');

    res.status(200).json({
      success: true,
      count: classes.length,
      data: classes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching classes'
    });
  }
};

// @desc    Get single fitness class details by ID
// @route   GET /api/classes/:id
// @access  Public
exports.getClassById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format'
      });
    }

    const fitnessClass = await FitnessClass.findById(id).populate(
      'enrolledMembers',
      'username email membershipTier'
    );

    if (!fitnessClass) {
      return res.status(404).json({
        success: false,
        message: 'Fitness class not found'
      });
    }

    res.status(200).json({
      success: true,
      data: fitnessClass
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching class details'
    });
  }
};

// @desc    Book a spot in a fitness class
// @route   POST /api/classes/:id/book
// @access  Private
exports.bookClass = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format'
      });
    }

    const fitnessClass = await FitnessClass.findById(id);
    if (!fitnessClass) {
      return res.status(404).json({
        success: false,
        message: 'Fitness class not found'
      });
    }

    // Check membership status / expiry
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const now = new Date();
    if (new Date(user.membershipExpiryDate) < now || user.membershipStatus === 'expired') {
      return res.status(400).json({
        success: false,
        message: 'Membership expired'
      });
    }

    // Check for duplicate booking
    const alreadyEnrolled = fitnessClass.enrolledMembers.some(
      (memberId) => memberId.toString() === userId.toString()
    );

    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'User is already enrolled in this class'
      });
    }

    // Check if class capacity is reached
    if (fitnessClass.enrolledMembers.length >= fitnessClass.maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Class capacity reached'
      });
    }

    fitnessClass.enrolledMembers.push(userId);
    await fitnessClass.save();

    const updatedClass = await FitnessClass.findById(id).populate(
      'enrolledMembers',
      'username email membershipTier'
    );

    res.status(200).json({
      success: true,
      message: 'Successfully booked class',
      data: updatedClass
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error booking class'
    });
  }
};

// @desc    Cancel booking in a fitness class
// @route   DELETE /api/classes/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format'
      });
    }

    const fitnessClass = await FitnessClass.findById(id);
    if (!fitnessClass) {
      return res.status(404).json({
        success: false,
        message: 'Fitness class not found'
      });
    }

    // Check if user is enrolled
    const enrolledIndex = fitnessClass.enrolledMembers.findIndex(
      (memberId) => memberId.toString() === userId.toString()
    );

    if (enrolledIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'User is not enrolled in this class'
      });
    }

    fitnessClass.enrolledMembers.splice(enrolledIndex, 1);
    await fitnessClass.save();

    const updatedClass = await FitnessClass.findById(id).populate(
      'enrolledMembers',
      'username email membershipTier'
    );

    res.status(200).json({
      success: true,
      message: 'Class booking cancelled successfully',
      data: updatedClass
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error cancelling class booking'
    });
  }
};
