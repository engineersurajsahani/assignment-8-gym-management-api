const FitnessClass = require('../models/FitnessClass');

const getClasses = async (req, res) => {
  try {
    const filter = {
      scheduleDate: { $gte: new Date() }
    };

    if (req.query.trainer) {
      filter.trainerName = { $regex: req.query.trainer, $options: 'i' };
    }

    const classes = await FitnessClass.find(filter)
      .populate('enrolledMembers', 'username email membershipTier')
      .sort({ scheduleDate: 1 });

    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch classes', error: error.message });
  }
};

const getClassById = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id)
      .populate('enrolledMembers', 'username email membershipTier membershipStatus');

    if (!fitnessClass) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.status(200).json(fitnessClass);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch class', error: error.message });
  }
};

const createClass = async (req, res) => {
  try {
    const { title, trainerName, scheduleDate, durationMinutes, maxCapacity } = req.body;

    if (!title || !trainerName || !scheduleDate || !maxCapacity) {
      return res.status(400).json({
        message: 'title, trainerName, scheduleDate and maxCapacity are required'
      });
    }

    const classDate = new Date(scheduleDate);
    if (Number.isNaN(classDate.getTime()) || classDate <= new Date()) {
      return res.status(400).json({ message: 'scheduleDate must be a valid future date' });
    }

    const fitnessClass = await FitnessClass.create({
      title,
      trainerName,
      scheduleDate: classDate,
      durationMinutes: durationMinutes || 60,
      maxCapacity
    });

    res.status(201).json({
      message: 'Fitness class created successfully',
      class: fitnessClass
    });
  } catch (error) {
    res.status(400).json({ message: 'Could not create class', error: error.message });
  }
};

const bookClass = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);

    if (!fitnessClass) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (fitnessClass.scheduleDate <= new Date()) {
      return res.status(400).json({ message: 'Cannot book a class that has already started' });
    }

    if (fitnessClass.enrolledMembers.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    )) {
      return res.status(400).json({ message: 'Member already booked for this class' });
    }

    if (fitnessClass.enrolledMembers.length >= fitnessClass.maxCapacity) {
      return res.status(400).json({ message: 'Class capacity reached' });
    }

    fitnessClass.enrolledMembers.push(req.user._id);
    await fitnessClass.save();

    res.status(200).json({
      message: 'Class booked successfully',
      class: fitnessClass
    });
  } catch (error) {
    res.status(500).json({ message: 'Booking failed', error: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);

    if (!fitnessClass) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const originalLength = fitnessClass.enrolledMembers.length;

    fitnessClass.enrolledMembers = fitnessClass.enrolledMembers.filter(
      (memberId) => memberId.toString() !== req.user._id.toString()
    );

    if (fitnessClass.enrolledMembers.length === originalLength) {
      return res.status(400).json({ message: 'Member is not booked for this class' });
    }

    await fitnessClass.save();

    res.status(200).json({
      message: 'Booking cancelled successfully',
      class: fitnessClass
    });
  } catch (error) {
    res.status(500).json({ message: 'Cancellation failed', error: error.message });
  }
};

module.exports = {
  getClasses,
  getClassById,
  createClass,
  bookClass,
  cancelBooking
};
