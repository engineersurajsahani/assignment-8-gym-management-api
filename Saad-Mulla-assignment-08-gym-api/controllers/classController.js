const FitnessClass = require('../models/FitnessClass');

exports.getAllClasses = async (req, res) => {
  try {
    const { trainer } = req.query;
    let filter = {};
    if (trainer) {
      filter.trainerName = new RegExp(trainer, 'i');
    }
    const classes = await FitnessClass.find(filter).populate('enrolledMembers', 'username email');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getClassById = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id).populate('enrolledMembers', 'username email membershipTier');
    if (!fitnessClass) {
      return res.status(404).json({ error: 'Fitness class not found.' });
    }
    res.json(fitnessClass);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createClass = async (req, res) => {
  try {
    const { title, trainerName, scheduleDate, durationMinutes, maxCapacity } = req.body;
    const newClass = new FitnessClass({
      title,
      trainerName,
      scheduleDate,
      durationMinutes: durationMinutes || 60,
      maxCapacity
    });
    await newClass.save();
    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.bookClass = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);
    if (!fitnessClass) {
      return res.status(404).json({ error: 'Fitness class not found.' });
    }

    if (fitnessClass.enrolledMembers.length >= fitnessClass.maxCapacity) {
      return res.status(400).json({ error: 'Class capacity reached' });
    }

    if (fitnessClass.enrolledMembers.includes(req.user._id)) {
      return res.status(400).json({ error: 'You are already enrolled in this class.' });
    }

    fitnessClass.enrolledMembers.push(req.user._id);
    await fitnessClass.save();

    res.json({ message: 'Class booked successfully', class: fitnessClass });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);
    if (!fitnessClass) {
      return res.status(404).json({ error: 'Fitness class not found.' });
    }

    const memberIndex = fitnessClass.enrolledMembers.indexOf(req.user._id);
    if (memberIndex === -1) {
      return res.status(400).json({ error: 'You are not enrolled in this class.' });
    }

    fitnessClass.enrolledMembers.splice(memberIndex, 1);
    await fitnessClass.save();

    res.json({ message: 'Booking cancelled successfully', class: fitnessClass });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};