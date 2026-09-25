const FitnessClass = require('../models/FitnessClass');

// @desc    Fetch all classes (supports filter by ?trainer=John)
// @route   GET /api/classes
// @access  Public
exports.getClasses = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.trainer) {
      filter.trainerName = { $regex: new RegExp(req.query.trainer.trim(), 'i') };
    }
    if (req.query.title) {
      filter.title = { $regex: new RegExp(req.query.title.trim(), 'i') };
    }

    const classes = await FitnessClass.find(filter)
      .populate('enrolledMembers', 'username email membershipTier')
      .sort({ scheduleDate: 1 });

    return res.status(200).json({
      success: true,
      count: classes.length,
      data: classes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get class details with enrolled members list
// @route   GET /api/classes/:id
// @access  Public
exports.getClassById = async (req, res, next) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id)
      .populate('enrolledMembers', 'username email membershipTier membershipStatus');

    if (!fitnessClass) {
      return res.status(404).json({
        success: false,
        message: `Fitness class not found with ID ${req.params.id}`
      });
    }

    return res.status(200).json({
      success: true,
      data: fitnessClass
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: `Fitness class not found with ID ${req.params.id}`
      });
    }
    next(error);
  }
};

// @desc    Create a new workout class
// @route   POST /api/classes
// @access  Private
exports.createClass = async (req, res, next) => {
  try {
    const { title, trainerName, scheduleDate, durationMinutes, maxCapacity } = req.body;

    if (!title || !trainerName || !scheduleDate || maxCapacity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, trainerName, scheduleDate, and maxCapacity.'
      });
    }

    if (parseInt(maxCapacity, 10) < 1) {
      return res.status(400).json({
        success: false,
        message: 'maxCapacity must be at least 1.'
      });
    }

    const newClass = await FitnessClass.create({
      title: title.trim(),
      trainerName: trainerName.trim(),
      scheduleDate: new Date(scheduleDate),
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 60,
      maxCapacity: parseInt(maxCapacity, 10),
      enrolledMembers: []
    });

    return res.status(201).json({
      success: true,
      message: 'Fitness class created successfully',
      data: newClass
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

// @desc    Enroll logged-in user into class with capacity check
// @route   POST /api/classes/:id/book
// @access  Private (Active Member only)
exports.bookClass = async (req, res, next) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);

    if (!fitnessClass) {
      return res.status(404).json({
        success: false,
        message: `Fitness class not found with ID ${req.params.id}`
      });
    }

    const userId = req.user._id;

    // Check if member is already enrolled
    const isEnrolled = fitnessClass.enrolledMembers.some(
      (memberId) => memberId.toString() === userId.toString()
    );

    if (isEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this fitness class.'
      });
    }

    // Check capacity limit
    if (fitnessClass.enrolledMembers.length >= fitnessClass.maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Class capacity reached. No available seats.'
      });
    }

    // Add user to enrolled members
    fitnessClass.enrolledMembers.push(userId);
    await fitnessClass.save();

    await fitnessClass.populate('enrolledMembers', 'username email membershipTier');

    return res.status(200).json({
      success: true,
      message: 'Successfully booked into class',
      data: fitnessClass
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: `Fitness class not found with ID ${req.params.id}`
      });
    }
    next(error);
  }
};

// @desc    Cancel member booking from class
// @route   DELETE /api/classes/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res, next) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);

    if (!fitnessClass) {
      return res.status(404).json({
        success: false,
        message: `Fitness class not found with ID ${req.params.id}`
      });
    }

    const userId = req.user._id;

    const isEnrolled = fitnessClass.enrolledMembers.some(
      (memberId) => memberId.toString() === userId.toString()
    );

    if (!isEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'You are not enrolled in this fitness class.'
      });
    }

    fitnessClass.enrolledMembers = fitnessClass.enrolledMembers.filter(
      (memberId) => memberId.toString() !== userId.toString()
    );

    await fitnessClass.save();

    return res.status(200).json({
      success: true,
      message: 'Class booking cancelled successfully',
      data: fitnessClass
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: `Fitness class not found with ID ${req.params.id}`
      });
    }
    next(error);
  }
};
