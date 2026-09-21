const FitnessClass = require('../models/FitnessClass');
const User = require('../models/User');

const getUpcomingClasses = async (req, res) => {
  try {
    const { trainer } = req.query;
    
    let query = { scheduleDate: { $gte: new Date() } };
    if (trainer) {
      query.trainerName = new RegExp(trainer, 'i');
    }
    
    const classes = await FitnessClass.find(query)
      .sort({ scheduleDate: 1 })
      .populate('enrolledMembers', 'username email membershipTier');
    
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
};

const getClassById = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id)
      .populate('enrolledMembers', 'username email membershipTier membershipStatus');
    
    if (!fitnessClass) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    res.json(fitnessClass);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch class' });
  }
};

const createClass = async (req, res) => {
  try {
    const { title, trainerName, scheduleDate, durationMinutes, maxCapacity } = req.body;
    
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
    res.status(500).json({ error: 'Failed to create class', details: error.message });
  }
};

const bookClass = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);
    
    if (!fitnessClass) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    const user = req.user;
    user.checkAndUpdateExpiry();
    await user.save();
    
    if (user.membershipStatus !== 'active') {
      return res.status(403).json({ error: 'Membership expired', status: user.membershipStatus });
    }
    
    if (new Date() > fitnessClass.scheduleDate) {
      return res.status(400).json({ error: 'Cannot book past classes' });
    }
    
    if (fitnessClass.isFull()) {
      return res.status(400).json({ error: 'Class is full', availableSpots: 0 });
    }
    
    if (fitnessClass.isMemberEnrolled(user._id)) {
      return res.status(400).json({ error: 'Already enrolled in this class' });
    }
    
    fitnessClass.enrolledMembers.push(user._id);
    await fitnessClass.save();
    
    await fitnessClass.populate('enrolledMembers', 'username email membershipTier');
    
    res.json({ 
      message: 'Class booked successfully', 
      class: fitnessClass,
      remainingSpots: fitnessClass.availableSpots
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to book class', details: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);
    
    if (!fitnessClass) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    const userIndex = fitnessClass.enrolledMembers.findIndex(
      id => id.toString() === req.user._id.toString()
    );
    
    if (userIndex === -1) {
      return res.status(400).json({ error: 'Not enrolled in this class' });
    }
    
    fitnessClass.enrolledMembers.splice(userIndex, 1);
    await fitnessClass.save();
    
    res.json({ message: 'Booking cancelled successfully', class: fitnessClass });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

module.exports = { 
  getUpcomingClasses, 
  getClassById, 
  createClass, 
  bookClass, 
  cancelBooking 
};
