const FitnessClass = require('../models/FitnessClass');

// Get all classes
const getClasses = async (req, res) => {
  try {
    const filter = {};

    if (req.query.trainer) {
      filter.trainerName = req.query.trainer;
    }

    const classes = await FitnessClass.find(filter)
      .populate('enrolledMembers', 'username email membershipTier');

    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch classes',
      error: error.message
    });
  }
};

// Get one class
const getClassById = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id)
      .populate('enrolledMembers', 'username email membershipTier');

    if (!fitnessClass) {
      return res.status(404).json({
        message: 'Class not found'
      });
    }

    res.status(200).json(fitnessClass);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch class',
      error: error.message
    });
  }
};

// Create a class
const createClass = async (req, res) => {
  try {
    const {
      title,
      trainerName,
      scheduleDate,
      durationMinutes,
      maxCapacity
    } = req.body;

    if (!title || !trainerName || !scheduleDate || !maxCapacity) {
      return res.status(400).json({
        message: 'title, trainerName, scheduleDate and maxCapacity are required'
      });
    }

    const fitnessClass = await FitnessClass.create({
      title,
      trainerName,
      scheduleDate,
      durationMinutes: durationMinutes || 60,
      maxCapacity
    });

    res.status(201).json({
      message: 'Fitness class created successfully',
      fitnessClass
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create class',
      error: error.message
    });
  }
};

// Book a class
const bookClass = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);

    if (!fitnessClass) {
      return res.status(404).json({
        message: 'Class not found'
      });
    }

    const alreadyBooked = fitnessClass.enrolledMembers.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (alreadyBooked) {
      return res.status(400).json({
        message: 'You are already booked for this class'
      });
    }

    if (fitnessClass.enrolledMembers.length >= fitnessClass.maxCapacity) {
      return res.status(400).json({
        message: 'Class capacity reached'
      });
    }

    fitnessClass.enrolledMembers.push(req.user._id);

    await fitnessClass.save();

    res.status(200).json({
      message: 'Class booked successfully',
      fitnessClass
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to book class',
      error: error.message
    });
  }
};

// Cancel class booking
const cancelBooking = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);

    if (!fitnessClass) {
      return res.status(404).json({
        message: 'Class not found'
      });
    }

    const memberIndex = fitnessClass.enrolledMembers.findIndex(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (memberIndex === -1) {
      return res.status(400).json({
        message: 'You are not booked for this class'
      });
    }

    fitnessClass.enrolledMembers.splice(memberIndex, 1);

    await fitnessClass.save();

    res.status(200).json({
      message: 'Class booking cancelled successfully',
      fitnessClass
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
};

module.exports = {
  getClasses,
  getClassById,
  createClass,
  bookClass,
  cancelBooking
};