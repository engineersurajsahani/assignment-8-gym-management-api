const FitnessClass = require('../models/FitnessClass');

exports.getAllClasses = async (req, res) => {
  try {
    const { trainer } = req.query;
    const filter = {};

    if (trainer) {
      filter.trainerName = new RegExp(trainer, 'i');
    }

    const classes = await FitnessClass.find(filter)
      .populate('enrolledMembers', 'username email membershipTier')
      .sort({ scheduleDate: 1 });

    res.status(200).json({
      success: true,
      count: classes.length,
      data: classes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getClassById = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id)
      .populate('enrolledMembers', 'username email membershipTier');

    if (!fitnessClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    res.status(200).json({
      success: true,
      data: fitnessClass
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.createClass = async (req, res) => {
  try {
    const { title, trainerName, scheduleDate, durationMinutes, maxCapacity } = req.body;

    if (!title || !trainerName || !scheduleDate || !maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Title, trainerName, scheduleDate, and maxCapacity are required'
      });
    }

    const newClass = new FitnessClass({
      title: title.trim(),
      trainerName: trainerName.trim(),
      scheduleDate: new Date(scheduleDate),
      durationMinutes: durationMinutes ? Number(durationMinutes) : 60,
      maxCapacity: Number(maxCapacity),
      enrolledMembers: []
    });

    await newClass.save();

    res.status(201).json({
      success: true,
      message: 'Fitness class created successfully',
      data: newClass
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.bookClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const userId = req.user._id;

    const fitnessClass = await FitnessClass.findById(classId);
    if (!fitnessClass) {
      return res.status(404).json({ success: false, message: 'Fitness class not found' });
    }

    const isAlreadyEnrolled = fitnessClass.enrolledMembers.some(
      (mId) => mId.toString() === userId.toString()
    );

    if (isAlreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'You are already booked for this class'
      });
    }

    if (fitnessClass.enrolledMembers.length >= fitnessClass.maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Class capacity reached. Cannot book.'
      });
    }

    fitnessClass.enrolledMembers.push(userId);
    await fitnessClass.save();

    res.status(200).json({
      success: true,
      message: 'Successfully booked into class',
      data: fitnessClass
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const classId = req.params.id;
    const userId = req.user._id;

    const fitnessClass = await FitnessClass.findById(classId);
    if (!fitnessClass) {
      return res.status(404).json({ success: false, message: 'Fitness class not found' });
    }

    const memberIndex = fitnessClass.enrolledMembers.findIndex(
      (mId) => mId.toString() === userId.toString()
    );

    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You are not enrolled in this class'
      });
    }

    fitnessClass.enrolledMembers.splice(memberIndex, 1);
    await fitnessClass.save();

    res.status(200).json({
      success: true,
      message: 'Class booking cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
