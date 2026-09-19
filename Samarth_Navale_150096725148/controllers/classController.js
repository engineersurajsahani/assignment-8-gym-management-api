const FitnessClass = require('../models/FitnessClass');

const getClasses = async (req, res, next) => {
  try {
    const { trainer } = req.query;
    const filter = {};

    if (trainer) {
      filter.trainerName = { $regex: trainer, $options: 'i' };
    }

    const list = await FitnessClass.find(filter)
      .populate('enrolledMembers', 'username email membershipTier')
      .sort({ scheduleDate: 1 });

    return res.status(200).json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (err) {
    next(err);
  }
};

const getClassById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cls = await FitnessClass.findById(id).populate(
      'enrolledMembers',
      'username email membershipTier'
    );

    if (!cls) {
      return res.status(404).json({ success: false, message: 'Fitness class not found' });
    }

    return res.status(200).json({ success: true, data: cls });
  } catch (err) {
    next(err);
  }
};

const createClass = async (req, res, next) => {
  try {
    const { title, trainerName, scheduleDate, durationMinutes, maxCapacity } = req.body;

    if (!title || !trainerName || !scheduleDate || !maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'title, trainerName, scheduleDate, and maxCapacity are required'
      });
    }

    if (Number(maxCapacity) < 1) {
      return res.status(400).json({
        success: false,
        message: 'maxCapacity must be at least 1'
      });
    }

    const cls = new FitnessClass({
      title: title.trim(),
      trainerName: trainerName.trim(),
      scheduleDate: new Date(scheduleDate),
      durationMinutes: Number(durationMinutes) || 60,
      maxCapacity: Number(maxCapacity),
      enrolledMembers: []
    });

    await cls.save();

    return res.status(201).json({
      success: true,
      message: 'Fitness class created successfully',
      data: cls
    });
  } catch (err) {
    next(err);
  }
};

const bookClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const uid = req.user._id;

    const cls = await FitnessClass.findById(id);
    if (!cls) {
      return res.status(404).json({ success: false, message: 'Fitness class not found' });
    }

    const isEnrolled = cls.enrolledMembers.some((m) => m.toString() === uid.toString());
    if (isEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this class'
      });
    }

    if (cls.enrolledMembers.length >= cls.maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Class capacity reached'
      });
    }

    cls.enrolledMembers.push(uid);
    await cls.save();

    const populated = await FitnessClass.findById(id).populate(
      'enrolledMembers',
      'username email membershipTier'
    );

    return res.status(200).json({
      success: true,
      message: 'Enrolled in class successfully',
      data: populated
    });
  } catch (err) {
    next(err);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const uid = req.user._id;

    const cls = await FitnessClass.findById(id);
    if (!cls) {
      return res.status(404).json({ success: false, message: 'Fitness class not found' });
    }

    const isEnrolled = cls.enrolledMembers.some((m) => m.toString() === uid.toString());
    if (!isEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'You are not enrolled in this class'
      });
    }

    cls.enrolledMembers = cls.enrolledMembers.filter((m) => m.toString() !== uid.toString());
    await cls.save();

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: cls
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getClasses,
  getClassById,
  createClass,
  bookClass,
  cancelBooking
};
