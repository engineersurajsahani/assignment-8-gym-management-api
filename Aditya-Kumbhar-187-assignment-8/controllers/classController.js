const FitnessClass = require("../models/FitnessClass");

// get all upcoming classes, optional ?trainer=name filter
exports.getClasses = async (req, res) => {
  try {
    const filter = { scheduleDate: { $gte: new Date() } };

    if (req.query.trainer) {
      filter.trainerName = req.query.trainer;
    }

    const classes = await FitnessClass.find(filter);
    res.status(200).json(classes);
  } catch (err) {
    res.status(400).json({ message: "Something went wrong", error: err.message });
  }
};

// get one class with its enrolled members
exports.getClassById = async (req, res) => {
  try {
    const singleClass = await FitnessClass.findById(req.params.id).populate(
      "enrolledMembers",
      "username email"
    );

    if (!singleClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json(singleClass);
  } catch (err) {
    res.status(400).json({ message: "Something went wrong", error: err.message });
  }
};

// create a new workout class
exports.createClass = async (req, res) => {
  try {
    const { title, trainerName, scheduleDate, durationMinutes, maxCapacity } = req.body;

    if (!title || !trainerName || !scheduleDate || !maxCapacity) {
      return res.status(400).json({ message: "Please fill all the required fields" });
    }

    const newClass = await FitnessClass.create({
      title,
      trainerName,
      scheduleDate,
      durationMinutes,
      maxCapacity,
    });

    res.status(201).json(newClass);
  } catch (err) {
    res.status(400).json({ message: "Something went wrong", error: err.message });
  }
};

// enroll the logged in member into a class
exports.bookClass = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);

    if (!fitnessClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (fitnessClass.enrolledMembers.includes(req.user._id)) {
      return res.status(400).json({ message: "You already booked this class" });
    }

    if (fitnessClass.enrolledMembers.length >= fitnessClass.maxCapacity) {
      return res.status(400).json({ message: "Class capacity reached" });
    }

    fitnessClass.enrolledMembers.push(req.user._id);
    await fitnessClass.save();

    res.status(200).json({ message: "Class booked successfully" });
  } catch (err) {
    res.status(400).json({ message: "Something went wrong", error: err.message });
  }
};

// remove logged in member from a class
exports.cancelBooking = async (req, res) => {
  try {
    const fitnessClass = await FitnessClass.findById(req.params.id);

    if (!fitnessClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    fitnessClass.enrolledMembers = fitnessClass.enrolledMembers.filter(
      (memberId) => memberId.toString() !== req.user._id.toString()
    );

    await fitnessClass.save();

    res.status(200).json({ message: "Booking cancelled" });
  } catch (err) {
    res.status(400).json({ message: "Something went wrong", error: err.message });
  }
};
