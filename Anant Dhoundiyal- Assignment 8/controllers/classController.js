const FitnessClass = require('../models/FitnessClass');

/**
 * GET /api/classes — upcoming classes, optional ?trainer= filter
 */
async function listClasses(req, res) {
  try {
    const { trainer } = req.query;
    const filter = { scheduleDate: { $gte: new Date() } };

    if (trainer) {
      filter.trainerName = { $regex: trainer, $options: 'i' };
    }

    const classes = await FitnessClass.find(filter).sort({ scheduleDate: 1 });

    // Attach a lightweight availability count without populating full member docs
    const data = classes.map((c) => ({
      ...c.toObject(),
      seatsAvailable: c.maxCapacity - c.enrolledMembers.length
    }));

    return res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/classes/:id — details with populated enrolled members
 */
async function getClass(req, res) {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id).populate(
      'enrolledMembers',
      'username email membershipTier'
    );

    if (!fitnessClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const data = {
      ...fitnessClass.toObject(),
      seatsAvailable: fitnessClass.maxCapacity - fitnessClass.enrolledMembers.length
    };

    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/classes — create a new workout class
 */
async function createClass(req, res) {
  try {
    const { title, trainerName, scheduleDate, durationMinutes, maxCapacity } = req.body;

    if (!title || !trainerName || !scheduleDate || maxCapacity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'title, trainerName, scheduleDate and maxCapacity are required'
      });
    }

    const parsedDate = new Date(scheduleDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: 'scheduleDate must be a valid date' });
    }

    if (!Number.isInteger(maxCapacity) || maxCapacity < 1) {
      return res.status(400).json({ success: false, message: 'maxCapacity must be an integer >= 1' });
    }

    const fitnessClass = await FitnessClass.create({
      title,
      trainerName,
      scheduleDate: parsedDate,
      durationMinutes,
      maxCapacity
    });

    return res.status(201).json({ success: true, message: 'Class created', data: fitnessClass });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/classes/:id/book
 * Enrolls the logged-in user. Fails if class is full, already booked,
 * or (checkActiveMember middleware) the member's plan has expired.
 * Uses an atomic findOneAndUpdate with $size / $addToSet guard so two
 * concurrent bookings can't both slip past a full class.
 */
async function bookClass(req, res) {
  try {
    const classId = req.params.id;
    const userId = req.user.id;

    const fitnessClass = await FitnessClass.findById(classId);
    if (!fitnessClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    if (fitnessClass.enrolledMembers.some((m) => m.toString() === userId)) {
      return res.status(400).json({ success: false, message: 'You are already booked into this class' });
    }

    // Atomic conditional update: only succeeds if the class still has room
    // at the moment of the update, preventing race-condition overbooking.
    const updated = await FitnessClass.findOneAndUpdate(
      {
        _id: classId,
        $expr: { $lt: [{ $size: '$enrolledMembers' }, '$maxCapacity'] }
      },
      { $addToSet: { enrolledMembers: userId } },
      { new: true }
    );

    if (!updated) {
      return res.status(400).json({ success: false, message: 'Class capacity reached' });
    }

    return res.status(200).json({ success: true, message: 'Successfully booked into class', data: updated });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * DELETE /api/classes/:id/cancel — cancel the logged-in member's booking
 */
async function cancelBooking(req, res) {
  try {
    const classId = req.params.id;
    const userId = req.user.id;

    const fitnessClass = await FitnessClass.findById(classId);
    if (!fitnessClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const wasBooked = fitnessClass.enrolledMembers.some((m) => m.toString() === userId);
    if (!wasBooked) {
      return res.status(400).json({ success: false, message: 'You are not booked into this class' });
    }

    fitnessClass.enrolledMembers = fitnessClass.enrolledMembers.filter((m) => m.toString() !== userId);
    await fitnessClass.save();

    return res.status(200).json({ success: true, message: 'Booking cancelled', data: fitnessClass });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { listClasses, getClass, createClass, bookClass, cancelBooking };
