const FitnessClass = require('../models/FitnessClass');

const getClasses = async (req, res) => {
  try {
    const filter = { scheduleDate: { $gte: new Date() } };

    if (req.query.trainer) {
      filter.trainerName = { $regex: req.query.trainer, $options: 'i' };
    }

    const classes = await FitnessClass.find(filter).sort({ scheduleDate: 1 });

    return res.status(200).json({ success: true, count: classes.length, data: classes });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const getClassById = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id).populate(
      'enrolledMembers',
      'username email membershipTier'
    );

    if (!fitnessClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    return res.status(200).json({ success: true, data: fitnessClass });
  } catch (err) {
    return res.status(404).json({ success: false, message: 'Class not found' });
  }
};

const createClass = async (req, res) => {
  try {
    const { title, trainerName, scheduleDate, durationMinutes, maxCapacity } = req.body;

    if (!title || !trainerName || !scheduleDate || !maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'title, trainerName, scheduleDate and maxCapacity are required',
      });
    }

    const newClass = await FitnessClass.create({
      title,
      trainerName,
      scheduleDate,
      durationMinutes,
      maxCapacity,
    });

    return res.status(201).json({ success: true, data: newClass });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const bookClass = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);

    if (!fitnessClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const userId = req.user._id.toString();
    const alreadyEnrolled = fitnessClass.enrolledMembers.some(
      (memberId) => memberId.toString() === userId
    );

    if (alreadyEnrolled) {
      return res.status(400).json({ success: false, message: 'Already booked into this class' });
    }

    if (fitnessClass.enrolledMembers.length >= fitnessClass.maxCapacity) {
      return res.status(400).json({ success: false, message: 'Class capacity reached' });
    }

    fitnessClass.enrolledMembers.push(req.user._id);
    await fitnessClass.save();

    return res.status(200).json({
      success: true,
      message: 'Successfully booked into class',
      data: fitnessClass,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);

    if (!fitnessClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const userId = req.user._id.toString();
    const wasEnrolled = fitnessClass.enrolledMembers.some(
      (memberId) => memberId.toString() === userId
    );

    if (!wasEnrolled) {
      return res.status(400).json({ success: false, message: 'You are not booked into this class' });
    }

    fitnessClass.enrolledMembers = fitnessClass.enrolledMembers.filter(
      (memberId) => memberId.toString() !== userId
    );
    await fitnessClass.save();

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: fitnessClass,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = { getClasses, getClassById, createClass, bookClass, cancelBooking };
