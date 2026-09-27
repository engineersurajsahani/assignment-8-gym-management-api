const FitnessClass = require('../models/FitnessClass');

exports.getClasses = async (req, res) => {
  try {
    const { trainer } = req.query;
    const filter = {};
    if (trainer) {
      filter.trainerName = new RegExp(trainer, 'i');
    }
    
    const classes = await FitnessClass.find(filter).sort({ scheduleDate: 1 });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getClassById = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id).populate('enrolledMembers', 'username email');
    if (!fitnessClass) return res.status(404).json({ message: 'Class not found' });
    res.json(fitnessClass);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createClass = async (req, res) => {
  try {
    const { title, trainerName, scheduleDate, durationMinutes, maxCapacity } = req.body;
    
    if (!title || !trainerName || !scheduleDate || !maxCapacity) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const fitnessClass = new FitnessClass({
      title,
      trainerName,
      scheduleDate,
      durationMinutes,
      maxCapacity
    });

    await fitnessClass.save();
    res.status(201).json(fitnessClass);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.bookClass = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);
    if (!fitnessClass) return res.status(404).json({ message: 'Class not found' });
    
    if (fitnessClass.enrolledMembers.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already enrolled in this class' });
    }

    if (fitnessClass.enrolledMembers.length >= fitnessClass.maxCapacity) {
      return res.status(400).json({ message: 'Class capacity reached' });
    }

    fitnessClass.enrolledMembers.push(req.user._id);
    await fitnessClass.save();
    
    res.json({ message: 'Successfully booked class', class: fitnessClass });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);
    if (!fitnessClass) return res.status(404).json({ message: 'Class not found' });
    
    fitnessClass.enrolledMembers = fitnessClass.enrolledMembers.filter(
      memberId => memberId.toString() !== req.user._id.toString()
    );
    
    await fitnessClass.save();
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
