const FitnessClass = require('../models/FitnessClass');

exports.getClasses = async (req, res) => {
  try {
    const filter = { scheduleDate: { $gte: new Date() } };
    if (req.query.trainer) {
      filter.trainerName = new RegExp(req.query.trainer, 'i');
    }

    const classes = await FitnessClass.find(filter)
      .populate('enrolledMembers', 'username email')
      .sort({ scheduleDate: 1 });

    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch classes.',
      error: error.message
    });
  }
};

exports.getClassById = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id)
      .populate('enrolledMembers', 'username email membershipTier');

    if (!fitnessClass) {
      return res.status(404).json({ message: 'Fitness class not found.' });
    }

    res.status(200).json(fitnessClass);
  } catch (error) {
    res.status(400).json({
      message: 'Invalid class ID.',
      error: error.message
    });
  }
};

exports.createClass = async (req, res) => {
  try {
    const {
      title, trainerName, scheduleDate,
      durationMinutes = 60, maxCapacity
    } = req.body;

    if (!title || !trainerName || !scheduleDate || !maxCapacity) {
      return res.status(400).json({
        message: 'title, trainerName, scheduleDate and maxCapacity are required.'
      });
    }

    const fitnessClass = await FitnessClass.create({
      title,
      trainerName,
      scheduleDate,
      durationMinutes,
      maxCapacity,
      enrolledMembers: []
    });

    res.status(201).json({
      message: 'Fitness class created successfully.',
      fitnessClass
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to create fitness class.',
      error: error.message
    });
  }
};

exports.bookClass = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);
    if (!fitnessClass) {
      return res.status(404).json({ message: 'Fitness class not found.' });
    }

    if (req.user.membershipExpiryDate < new Date()) {
      return res.status(400).json({
        message: 'Membership expired. Cannot book a class.'
      });
    }

    const alreadyBooked = fitnessClass.enrolledMembers.some(
      id => id.toString() === req.user._id.toString()
    );

    if (alreadyBooked) {
      return res.status(400).json({
        message: 'You are already enrolled in this class.'
      });
    }

    if (fitnessClass.enrolledMembers.length >= fitnessClass.maxCapacity) {
      return res.status(400).json({
        message: 'Class capacity reached.'
      });
    }

    fitnessClass.enrolledMembers.push(req.user._id);
    await fitnessClass.save();

    const updated = await FitnessClass.findById(fitnessClass._id)
      .populate('enrolledMembers', 'username email');

    res.status(200).json({
      message: 'Class booking successful.',
      fitnessClass: updated
    });
  } catch (error) {
    res.status(400).json({
      message: 'Booking failed.',
      error: error.message
    });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);
    if (!fitnessClass) {
      return res.status(404).json({ message: 'Fitness class not found.' });
    }

    const original = fitnessClass.enrolledMembers.length;
    fitnessClass.enrolledMembers = fitnessClass.enrolledMembers.filter(
      id => id.toString() !== req.user._id.toString()
    );

    if (fitnessClass.enrolledMembers.length === original) {
      return res.status(400).json({
        message: 'You are not enrolled in this class.'
      });
    }

    await fitnessClass.save();
    res.status(200).json({
      message: 'Class booking cancelled successfully.'
    });
  } catch (error) {
    res.status(400).json({
      message: 'Cancellation failed.',
      error: error.message
    });
  }
};
