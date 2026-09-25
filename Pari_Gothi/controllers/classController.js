const FitnessClass = require('../models/FitnessClass');
const User = require('../models/User');

// GET /api/classes (supports ?trainer=John)
const getAllClasses = async (req, res) => {
  try {
    const filter = {};
    const { trainer } = req.query;

    if (trainer) {
      filter.trainerName = { $regex: new RegExp(trainer.trim(), 'i') };
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
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve fitness classes.',
      error: error.message
    });
  }
};

// GET /api/classes/:id (with enrolled members populated)
const getClassById = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id)
      .populate('enrolledMembers', 'username email membershipTier membershipStatus');

    if (!fitnessClass) {
      return res.status(404).json({
        success: false,
        message: 'Fitness class not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: fitnessClass
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid class ID format or error fetching class.',
      error: error.message
    });
  }
};

// POST /api/classes
const createClass = async (req, res) => {
  try {
    const { title, trainerName, scheduleDate, durationMinutes, maxCapacity } = req.body;

    if (!title || !trainerName || !scheduleDate || maxCapacity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, trainerName, scheduleDate, and maxCapacity.'
      });
    }

    const newClass = new FitnessClass({
      title: title.trim(),
      trainerName: trainerName.trim(),
      scheduleDate: new Date(scheduleDate),
      durationMinutes: durationMinutes || 60,
      maxCapacity: Number(maxCapacity),
      enrolledMembers: []
    });

    const savedClass = await newClass.save();

    return res.status(201).json({
      success: true,
      message: 'Fitness class created successfully.',
      data: savedClass
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error creating fitness class.'
    });
  }
};

// POST /api/classes/:id/book (session-authenticated; fails if full or membership expired)
const bookClass = async (req, res) => {
  try {
    const userId = req.user._id;

    // Verify member validity
    const member = await User.findById(userId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member record not found.'
      });
    }

    const now = new Date();
    const expiry = new Date(member.membershipExpiryDate);

    // Membership status and expiry check
    if (member.membershipStatus !== 'active' || expiry.getTime() < now.getTime()) {
      return res.status(400).json({
        success: false,
        message: 'Membership is expired or inactive. Expired memberships cannot book classes.'
      });
    }

    const fitnessClass = await FitnessClass.findById(req.params.id);

    if (!fitnessClass) {
      return res.status(404).json({
        success: false,
        message: 'Fitness class not found.'
      });
    }

    // Check if user is already enrolled
    const isAlreadyEnrolled = fitnessClass.enrolledMembers.some(
      (enrolledId) => enrolledId.toString() === userId.toString()
    );

    if (isAlreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'You are already booked for this class.'
      });
    }

    // Capacity check
    if (fitnessClass.enrolledMembers.length >= fitnessClass.maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Class capacity reached'
      });
    }

    // Add user to enrolled members
    fitnessClass.enrolledMembers.push(userId);
    await fitnessClass.save();

    const updatedClass = await FitnessClass.findById(fitnessClass._id)
      .populate('enrolledMembers', 'username email membershipTier');

    return res.status(200).json({
      success: true,
      message: 'Successfully booked class.',
      data: updatedClass
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to book class.'
    });
  }
};

// DELETE /api/classes/:id/cancel (session-authenticated; removes user's booking)
const cancelBooking = async (req, res) => {
  try {
    const userId = req.user._id;
    const fitnessClass = await FitnessClass.findById(req.params.id);

    if (!fitnessClass) {
      return res.status(404).json({
        success: false,
        message: 'Fitness class not found.'
      });
    }

    const isEnrolled = fitnessClass.enrolledMembers.some(
      (enrolledId) => enrolledId.toString() === userId.toString()
    );

    if (!isEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'You are not enrolled in this class.'
      });
    }

    fitnessClass.enrolledMembers = fitnessClass.enrolledMembers.filter(
      (enrolledId) => enrolledId.toString() !== userId.toString()
    );

    await fitnessClass.save();

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.',
      data: fitnessClass
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to cancel booking.'
    });
  }
};

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  bookClass,
  cancelBooking
};
