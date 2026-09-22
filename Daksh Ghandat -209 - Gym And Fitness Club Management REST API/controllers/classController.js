const mongoose = require('mongoose');
const FitnessClass = require('../models/FitnessClass');

// Fields exposed when a class is populated with its enrolled members.
// Passwords are NEVER included.
const MEMBER_POPULATE_FIELDS =
  'username email membershipTier membershipStatus membershipExpiryDate -_id';

// ------------------------------------------------------------------
// isValidObjectId
// Small guard so an invalid id like "abc" returns 400 instead of an
// ugly MongoDB CastError.
// ------------------------------------------------------------------
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ------------------------------------------------------------------
// GET /api/classes
// Query: ?trainer=John   (optional, case-insensitive)
// Returns only upcoming classes (scheduleDate >= now), sorted
// ascending by scheduleDate.
// ------------------------------------------------------------------
const getClasses = async (req, res) => {
  try {
    const { trainer } = req.query;

    const filter = { scheduleDate: { $gte: new Date() } };

    if (trainer && trainer.trim() !== '') {
      filter.trainerName = { $regex: trainer.trim(), $options: 'i' };
    }

    const classes = await FitnessClass.find(filter)
      .sort({ scheduleDate: 1 })
      .populate('enrolledMembers', MEMBER_POPULATE_FIELDS);

    return res.status(200).json({ count: classes.length, classes });
  } catch (error) {
    return res.status(500).json({ message: 'Server error while fetching classes' });
  }
};

// ------------------------------------------------------------------
// GET /api/classes/:id
// Returns a single class with enrolled members populated.
// ------------------------------------------------------------------
const getClassById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid class id' });
    }

    const fitnessClass = await FitnessClass.findById(id).populate(
      'enrolledMembers',
      MEMBER_POPULATE_FIELDS
    );

    if (!fitnessClass) {
      return res.status(404).json({ message: 'Class not found' });
    }

    return res.status(200).json(fitnessClass);
  } catch (error) {
    return res.status(500).json({ message: 'Server error while fetching class' });
  }
};

// ------------------------------------------------------------------
// POST /api/classes
// Create a new fitness class.
// ------------------------------------------------------------------
const createClass = async (req, res) => {
  try {
    const { title, trainerName, scheduleDate, durationMinutes, maxCapacity } = req.body;

    // ---- Validation ------------------------------------------------
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ message: 'Class title is required' });
    }
    if (!trainerName || typeof trainerName !== 'string' || trainerName.trim() === '') {
      return res.status(400).json({ message: 'Trainer name is required' });
    }
    const schedule = new Date(scheduleDate);
    if (!scheduleDate || Number.isNaN(schedule.getTime())) {
      return res.status(400).json({ message: 'A valid schedule date is required' });
    }
    const capacity = Number(maxCapacity);
    if (capacity < 1 || !Number.isInteger(capacity)) {
      return res.status(400).json({ message: 'maxCapacity must be an integer >= 1' });
    }

    const classData = {
      title: title.trim(),
      trainerName: trainerName.trim(),
      scheduleDate: schedule,
      maxCapacity: capacity,
      enrolledMembers: []
    };

    if (durationMinutes !== undefined) {
      const duration = Number(durationMinutes);
      if (duration < 1 || !Number.isInteger(duration)) {
        return res.status(400).json({ message: 'durationMinutes must be an integer >= 1' });
      }
      classData.durationMinutes = duration;
    }

    const fitnessClass = await FitnessClass.create(classData);

    return res.status(201).json(fitnessClass);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Server error while creating class' });
  }
};

// ------------------------------------------------------------------
// POST /api/classes/:id/book
// Protected + valid-membership required. Enrolls the logged-in user.
// ------------------------------------------------------------------
const bookClass = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid class id' });
    }

    // 1. Find the class.
    const fitnessClass = await FitnessClass.findById(id);
    if (!fitnessClass) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // 2. The class must be upcoming (the past cannot be booked).
    if (fitnessClass.scheduleDate < new Date()) {
      return res.status(400).json({ message: 'Cannot book a class that has already passed' });
    }

    // 3. Same member must not book the same class twice.
    const alreadyEnrolled = fitnessClass.enrolledMembers.some(
      (memberId) => memberId.toString() === userId.toString()
    );
    if (alreadyEnrolled) {
      return res.status(400).json({ message: 'You are already enrolled in this class' });
    }

    // 4-6. Capacity check — do not allow over-enrollment.
    if (fitnessClass.enrolledMembers.length >= fitnessClass.maxCapacity) {
      return res.status(400).json({ message: 'Class capacity reached' });
    }

    // 7. Add the member and save.
    fitnessClass.enrolledMembers.push(userId);
    await fitnessClass.save();

    const updated = await FitnessClass.findById(id).populate(
      'enrolledMembers',
      MEMBER_POPULATE_FIELDS
    );

    return res.status(200).json({ message: 'Class booked successfully', class: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Server error while booking class' });
  }
};

// ------------------------------------------------------------------
// DELETE /api/classes/:id/cancel
// Protected. Removes the logged-in user from the class.
// ------------------------------------------------------------------
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid class id' });
    }

    const fitnessClass = await FitnessClass.findById(id);
    if (!fitnessClass) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check whether the user is actually enrolled.
    const isEnrolled = fitnessClass.enrolledMembers.some(
      (memberId) => memberId.toString() === userId
    );
    if (!isEnrolled) {
      return res.status(400).json({ message: 'You are not enrolled in this class' });
    }

    fitnessClass.enrolledMembers = fitnessClass.enrolledMembers.filter(
      (memberId) => memberId.toString() !== userId
    );
    await fitnessClass.save();

    return res.status(200).json({ message: 'Class booking cancelled successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error while cancelling booking' });
  }
};

module.exports = { getClasses, getClassById, createClass, bookClass, cancelBooking };