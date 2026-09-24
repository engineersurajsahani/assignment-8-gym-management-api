const FitnessClass = require('../models/FitnessClass');

exports.getClasses = async (req, res) => {
  try {
    const { trainer } = req.query;
    const filter = { scheduleDate: { $gte: new Date() } }; // Upcoming classes
    
    if (trainer) {
      filter.trainerName = new RegExp(trainer, 'i');
    }

    const classes = await FitnessClass.find(filter).sort({ scheduleDate: 1 });
    res.status(200).json({ success: true, count: classes.length, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getClassById = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id).populate('enrolledMembers', 'username email');
    if (!fitnessClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    res.status(200).json({ success: true, data: fitnessClass });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createClass = async (req, res) => {
  try {
    const { title, trainerName, scheduleDate, durationMinutes, maxCapacity } = req.body;
    
    if (!title || !trainerName || !scheduleDate || !maxCapacity) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const newClass = new FitnessClass({
      title,
      trainerName,
      scheduleDate,
      durationMinutes,
      maxCapacity
    });

    await newClass.save();
    res.status(201).json({ success: true, data: newClass });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.bookClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const userId = req.user._id;

    const fitnessClass = await FitnessClass.findById(classId);
    if (!fitnessClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    if (fitnessClass.scheduleDate < new Date()) {
      return res.status(400).json({ success: false, message: 'Cannot book a past class' });
    }

    if (fitnessClass.enrolledMembers.includes(userId)) {
      return res.status(400).json({ success: false, message: 'Already enrolled in this class' });
    }

    if (fitnessClass.enrolledMembers.length >= fitnessClass.maxCapacity) {
      return res.status(400).json({ success: false, message: 'Class capacity reached' });
    }

    fitnessClass.enrolledMembers.push(userId);
    await fitnessClass.save();

    res.status(200).json({ success: true, message: 'Successfully booked class' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const classId = req.params.id;
    const userId = req.user._id;

    const fitnessClass = await FitnessClass.findById(classId);
    if (!fitnessClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    if (!fitnessClass.enrolledMembers.includes(userId)) {
      return res.status(400).json({ success: false, message: 'Not enrolled in this class' });
    }

    fitnessClass.enrolledMembers = fitnessClass.enrolledMembers.filter(id => id.toString() !== userId.toString());
    await fitnessClass.save();

    res.status(200).json({ success: true, message: 'Successfully canceled booking' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
