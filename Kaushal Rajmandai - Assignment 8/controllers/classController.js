const FitnessClass = require('../models/FitnessClass');

// GET /api/classes?trainer=John
const getAllClasses = async (req, res) => {
  try {
    const filter = {};
    if (req.query.trainer) {
      filter.trainerName = new RegExp(req.query.trainer, 'i');
    }
    const classes = await FitnessClass.find(filter).sort({ scheduleDate: 1 });
    res.status(200).json(classes);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET /api/classes/:id
const getClassById = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id)
      .populate('enrolledMembers', 'username email membershipTier');

    if (!fitnessClass) {
      return res.status(404).json({ message: 'Class not found.' });
    }
    res.status(200).json(fitnessClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// POST /api/classes
const createClass = async (req, res) => {
  try {
    const { title, trainerName, scheduleDate, durationMinutes, maxCapacity } = req.body;

    if (!title || !trainerName || !scheduleDate || !maxCapacity) {
      return res.status(400).json({ message: 'title, trainerName, scheduleDate, and maxCapacity are required.' });
    }

    const newClass = new FitnessClass({
      title, trainerName, scheduleDate, durationMinutes, maxCapacity
    });

    await newClass.save();
    res.status(201).json(newClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// POST /api/classes/:id/book
const bookClass = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);
    if (!fitnessClass) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    const userId = req.user._id;

    if (fitnessClass.enrolledMembers.some(id => id.equals(userId))) {
      return res.status(400).json({ message: 'You are already enrolled in this class.' });
    }

    if (fitnessClass.enrolledMembers.length >= fitnessClass.maxCapacity) {
      return res.status(400).json({ message: 'Class capacity reached.' });
    }

    fitnessClass.enrolledMembers.push(userId);
    await fitnessClass.save();

    res.status(200).json({ message: 'Successfully booked into class.', class: fitnessClass });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/classes/:id/cancel
const cancelBooking = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);
    if (!fitnessClass) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    const userId = req.user._id;
    fitnessClass.enrolledMembers = fitnessClass.enrolledMembers.filter(id => !id.equals(userId));
    await fitnessClass.save();

    res.status(200).json({ message: 'Booking cancelled.', class: fitnessClass });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getAllClasses, getClassById, createClass, bookClass, cancelBooking };