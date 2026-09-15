const FitnessClass = require('../models/FitnessClass');

/**
 * GET /api/classes
 * Fetch all upcoming classes. Supports ?trainer= filter.
 */
const getAllClasses = async (req, res, next) => {
  try {
    let query = FitnessClass.find({ scheduleDate: { $gte: new Date() } })
      .populate('enrolledMembers', 'username email membershipTier');

    if (req.query.trainer) {
      query = query.find({ trainerName: { $regex: req.query.trainer, $options: 'i' } });
    }

    const classes = await query.sort({ scheduleDate: 1 });

    return res.status(200).json({
      success: true,
      count: classes.length,
      classes,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/classes/:id
 * Get a single class with enrolled members list.
 */
const getClassById = async (req, res, next) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id)
      .populate('enrolledMembers', 'username email membershipTier');

    if (!fitnessClass) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    return res.status(200).json({
      success: true,
      class: fitnessClass,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/classes
 * Create a new workout class.
 */
const createClass = async (req, res, next) => {
  try {
    const { title, trainerName, scheduleDate, durationMinutes, maxCapacity } = req.body;

    if (!title || !trainerName || !scheduleDate || !maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'title, trainerName, scheduleDate and maxCapacity are required',
      });
    }

    if (typeof maxCapacity !== 'number' || maxCapacity < 1) {
      return res.status(400).json({
        success: false,
        message: 'maxCapacity must be a positive number',
      });
    }

    const fitnessClass = await FitnessClass.create({
      title,
      trainerName,
      scheduleDate: new Date(scheduleDate),
      durationMinutes: durationMinutes || 60,
      maxCapacity,
      enrolledMembers: [],
    });

    return res.status(201).json({
      success: true,
      message: 'Class created successfully',
      class: fitnessClass,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/classes/:id/book
 * Enroll logged-in user. Fails if class is full or user membership expired.
 */
const bookClass = async (req, res, next) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);

    if (!fitnessClass) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    // Check if class is full
    if (fitnessClass.enrolledMembers.length >= fitnessClass.maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Class capacity reached. No spots available.',
      });
    }

    // Check if already enrolled
    const alreadyEnrolled = fitnessClass.enrolledMembers.some(
      (memberId) => memberId.toString() === req.user.id
    );

    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this class.',
      });
    }

    // Check if class is in the past
    if (new Date(fitnessClass.scheduleDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book a class that has already started.',
      });
    }

    fitnessClass.enrolledMembers.push(req.user.id);
    await fitnessClass.save();

    return res.status(200).json({
      success: true,
      message: 'Successfully enrolled in class',
      class: {
        id: fitnessClass._id,
        title: fitnessClass.title,
        enrolledCount: fitnessClass.enrolledMembers.length,
        maxCapacity: fitnessClass.maxCapacity,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/classes/:id/cancel
 * Cancel member booking from class.
 */
const cancelBooking = async (req, res, next) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);

    if (!fitnessClass) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    const memberIndex = fitnessClass.enrolledMembers.findIndex(
      (memberId) => memberId.toString() === req.user.id
    );

    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You are not enrolled in this class.',
      });
    }

    fitnessClass.enrolledMembers.splice(memberIndex, 1);
    await fitnessClass.save();

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  bookClass,
  cancelBooking,
};
