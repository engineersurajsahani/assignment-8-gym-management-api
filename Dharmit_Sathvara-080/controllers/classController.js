const FitnessClass = require('../models/FitnessClass');

exports.getClasses = async (req, res) => {
  try {
    const filter = { scheduleDate: { $gte: new Date() } };
    if (req.query.trainer) filter.trainerName = new RegExp(`^${req.query.trainer}$`, 'i');

    const classes = await FitnessClass.find(filter).sort({ scheduleDate: 1 });
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch classes', error: error.message });
  }
};

exports.getClassById = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id).populate('enrolledMembers', 'username email membershipTier');
    if (!fitnessClass) return res.status(404).json({ message: 'Class not found' });
    res.status(200).json(fitnessClass);
  } catch (error) {
    if (error.name === 'CastError') return res.status(404).json({ message: 'Class not found' });
    res.status(500).json({ message: 'Failed to fetch class', error: error.message });
  }
};

exports.createClass = async (req, res) => {
  try {
    const { title, trainerName, scheduleDate, durationMinutes = 60, maxCapacity } = req.body;
    if (!title || !trainerName || !scheduleDate || !maxCapacity) {
      return res.status(400).json({ message: 'title, trainerName, scheduleDate and maxCapacity are required' });
    }

    const parsedDate = new Date(scheduleDate);
    if (Number.isNaN(parsedDate.getTime()) || parsedDate <= new Date()) {
      return res.status(400).json({ message: 'scheduleDate must be a valid future date' });
    }

    const fitnessClass = await FitnessClass.create({ title, trainerName, scheduleDate: parsedDate, durationMinutes, maxCapacity });
    res.status(201).json(fitnessClass);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
    res.status(500).json({ message: 'Failed to create class', error: error.message });
  }
};

exports.bookClass = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);
    if (!fitnessClass) return res.status(404).json({ message: 'Class not found' });

    if (fitnessClass.scheduleDate < new Date()) {
      return res.status(400).json({ message: 'Cannot book a class that has already started' });
    }

    const alreadyBooked = fitnessClass.enrolledMembers.some((id) => id.toString() === req.user._id.toString());
    if (alreadyBooked) return res.status(400).json({ message: 'Member is already enrolled in this class' });

    if (fitnessClass.enrolledMembers.length >= fitnessClass.maxCapacity) {
      return res.status(400).json({ message: 'Class capacity reached' });
    }

    fitnessClass.enrolledMembers.push(req.user._id);
    await fitnessClass.save();
    res.status(200).json({ message: 'Class booked successfully', class: fitnessClass });
  } catch (error) {
    res.status(500).json({ message: 'Booking failed', error: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);
    if (!fitnessClass) return res.status(404).json({ message: 'Class not found' });

    const before = fitnessClass.enrolledMembers.length;
    fitnessClass.enrolledMembers = fitnessClass.enrolledMembers.filter(
      (id) => id.toString() !== req.user._id.toString()
    );

    if (fitnessClass.enrolledMembers.length === before) {
      return res.status(400).json({ message: 'Member is not enrolled in this class' });
    }

    await fitnessClass.save();
    res.status(200).json({ message: 'Booking cancelled successfully', class: fitnessClass });
  } catch (error) {
    res.status(500).json({ message: 'Cancellation failed', error: error.message });
  }
};
