const FitnessClass = require('../models/FitnessClass');

// Fetch all classes (supports filter ?trainer=Name or ?trainerName=Name)
const getAllClasses = async (req, res) => {
  try {
    const filter = {};
    const trainerQuery = req.query.trainer || req.query.trainerName;
    if (trainerQuery) {
      filter.trainerName = new RegExp(trainerQuery, 'i');
    }

    const classes = await FitnessClass.find(filter)
      .populate('enrolledMembers', 'username email membershipTier')
      .sort({ scheduleDate: 1 });

    return res.status(200).json(classes);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get class details by ID with enrolled members list
const getClassById = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id)
      .populate('enrolledMembers', 'username email membershipTier membershipStatus');

    if (!fitnessClass) {
      return res.status(404).json({ error: 'Fitness class not found.' });
    }

    return res.status(200).json(fitnessClass);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Fitness class not found.' });
    }
    return res.status(500).json({ error: error.message });
  }
};

// Create a new workout class
const createClass = async (req, res) => {
  try {
    const { title, trainerName, scheduleDate, durationMinutes, maxCapacity } = req.body;

    if (!title || !trainerName || !scheduleDate || maxCapacity === undefined) {
      return res.status(400).json({ error: 'Title, trainerName, scheduleDate, and maxCapacity are required.' });
    }

    if (parseInt(maxCapacity) < 1) {
      return res.status(400).json({ error: 'maxCapacity must be at least 1.' });
    }

    const newClass = new FitnessClass({
      title,
      trainerName,
      scheduleDate,
      durationMinutes: durationMinutes || 60,
      maxCapacity: parseInt(maxCapacity),
      enrolledMembers: []
    });

    await newClass.save();

    return res.status(201).json({
      message: 'Fitness class created successfully.',
      fitnessClass: newClass
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Enroll logged-in user into a class (Fails if capacity reached or already booked)
const bookClass = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);
    if (!fitnessClass) {
      return res.status(404).json({ error: 'Fitness class not found.' });
    }

    const userId = req.user._id;

    // Check capacity constraint
    if (fitnessClass.enrolledMembers.length >= fitnessClass.maxCapacity) {
      return res.status(400).json({ error: 'Class capacity reached' });
    }

    // Check if user is already enrolled
    const isAlreadyEnrolled = fitnessClass.enrolledMembers.some(
      (memberId) => memberId.toString() === userId.toString()
    );

    if (isAlreadyEnrolled) {
      return res.status(400).json({ error: 'You are already enrolled in this class.' });
    }

    fitnessClass.enrolledMembers.push(userId);
    await fitnessClass.save();

    const updatedClass = await FitnessClass.findById(fitnessClass._id)
      .populate('enrolledMembers', 'username email membershipTier');

    return res.status(200).json({
      message: 'Class booked successfully.',
      fitnessClass: updatedClass
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Fitness class not found.' });
    }
    return res.status(500).json({ error: error.message });
  }
};

// Cancel member booking from class
const cancelBooking = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);
    if (!fitnessClass) {
      return res.status(404).json({ error: 'Fitness class not found.' });
    }

    const userId = req.user._id;

    const memberIndex = fitnessClass.enrolledMembers.findIndex(
      (memberId) => memberId.toString() === userId.toString()
    );

    if (memberIndex === -1) {
      return res.status(400).json({ error: 'You are not enrolled in this class.' });
    }

    fitnessClass.enrolledMembers.splice(memberIndex, 1);
    await fitnessClass.save();

    return res.status(200).json({
      message: 'Booking cancelled successfully.',
      fitnessClass
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Fitness class not found.' });
    }
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  bookClass,
  cancelBooking
};
