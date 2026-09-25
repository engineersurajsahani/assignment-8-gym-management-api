const mongoose = require("mongoose");
const FitnessClass = require("../models/FitnessClass");
const User = require("../models/User");

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const validationMessage = (error) =>
  Object.values(error.errors)
    .map((e) => e.message)
    .join(", ");

const getClasses = async (request, response) => {
  try {
    const filter = { scheduleDate: { $gte: new Date() } };

    if (request.query.trainer) {
      filter.trainerName = {
        $regex: escapeRegex(String(request.query.trainer).trim()),
        $options: "i",
      };
    }

    const classes = await FitnessClass.find(filter).sort({ scheduleDate: 1 });
    return response.status(200).json({ count: classes.length, classes });
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
};

const getClassById = async (request, response) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(404).json({ message: "Class not found!" });
    }

    const fitnessClass = await FitnessClass.findById(request.params.id).populate(
      "enrolledMembers",
      "username membershipTier",
    );
    if (!fitnessClass) {
      return response.status(404).json({ message: "Class not found!" });
    }
    return response.status(200).json({ class: fitnessClass });
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
};

const createClass = async (request, response) => {
  try {
    const { title, trainerName, scheduleDate, durationMinutes, maxCapacity } =
      request.body;

    if (!title || !trainerName || !scheduleDate || maxCapacity === undefined) {
      return response.status(400).json({
        message: "title, trainerName, scheduleDate and maxCapacity are required!",
      });
    }

    if (isNaN(new Date(scheduleDate).getTime())) {
      return response.status(400).json({ message: "scheduleDate is not a valid date!" });
    }

    if (!Number.isInteger(Number(maxCapacity)) || Number(maxCapacity) < 1) {
      return response
        .status(400)
        .json({ message: "maxCapacity must be a whole number of at least 1!" });
    }

    const fitnessClass = await FitnessClass.create({
      title,
      trainerName,
      scheduleDate,
      durationMinutes,
      maxCapacity,
    });

    return response.status(201).json({ message: "Class created!", class: fitnessClass });
  } catch (error) {
    if (error.name === "ValidationError") {
      return response.status(400).json({ message: validationMessage(error) });
    }
    return response.status(500).json({ message: error.message });
  }
};

const updateClass = async (request, response) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(404).json({ message: "Class not found!" });
    }

    const fitnessClass = await FitnessClass.findById(request.params.id);
    if (!fitnessClass) {
      return response.status(404).json({ message: "Class not found!" });
    }

    const fields = ["title", "trainerName", "scheduleDate", "durationMinutes", "maxCapacity"];
    for (const field of fields) {
      if (request.body[field] !== undefined) {
        fitnessClass[field] = request.body[field];
      }
    }

    await fitnessClass.save();
    return response.status(200).json({ message: "Class updated!", class: fitnessClass });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return response
        .status(400)
        .json({ message: error.errors ? validationMessage(error) : error.message });
    }
    return response.status(500).json({ message: error.message });
  }
};

const deleteClass = async (request, response) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(404).json({ message: "Class not found!" });
    }

    const fitnessClass = await FitnessClass.findByIdAndDelete(request.params.id);
    if (!fitnessClass) {
      return response.status(404).json({ message: "Class not found!" });
    }

    await User.updateMany(
      { enrolledClasses: fitnessClass._id },
      { $pull: { enrolledClasses: fitnessClass._id } },
    );

    return response.status(200).json({ message: "Class deleted!", class: fitnessClass });
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
};

// single atomic update: the capacity check and the push happen together,
// so two members can never both take the last seat
const bookClass = async (request, response) => {
  try {
    const classId = request.params.id;
    const userId = request.user._id;

    if (!mongoose.isValidObjectId(classId)) {
      return response.status(404).json({ message: "Class not found!" });
    }

    const booked = await FitnessClass.findOneAndUpdate(
      {
        _id: classId,
        scheduleDate: { $gt: new Date() },
        enrolledMembers: { $ne: userId },
        $expr: { $lt: [{ $size: "$enrolledMembers" }, "$maxCapacity"] },
      },
      { $push: { enrolledMembers: userId } },
      { returnDocument: "after" },
    );

    if (!booked) {
      const fitnessClass = await FitnessClass.findById(classId);
      if (!fitnessClass) {
        return response.status(404).json({ message: "Class not found!" });
      }
      if (fitnessClass.enrolledMembers.some((id) => id.equals(userId))) {
        return response.status(400).json({ message: "You already booked this class!" });
      }
      if (fitnessClass.scheduleDate <= new Date()) {
        return response.status(400).json({ message: "This class has already started!" });
      }
      return response.status(400).json({ message: "Class capacity reached!" });
    }

    await User.updateOne({ _id: userId }, { $addToSet: { enrolledClasses: booked._id } });

    return response.status(200).json({ message: "Class booked!", class: booked });
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
};

const cancelBooking = async (request, response) => {
  try {
    const classId = request.params.id;
    const userId = request.user._id;

    if (!mongoose.isValidObjectId(classId)) {
      return response.status(404).json({ message: "Class not found!" });
    }

    const fitnessClass = await FitnessClass.findOneAndUpdate(
      { _id: classId, enrolledMembers: userId },
      { $pull: { enrolledMembers: userId } },
      { returnDocument: "after" },
    );

    if (!fitnessClass) {
      const exists = await FitnessClass.exists({ _id: classId });
      if (!exists) {
        return response.status(404).json({ message: "Class not found!" });
      }
      return response.status(400).json({ message: "You have not booked this class!" });
    }

    await User.updateOne({ _id: userId }, { $pull: { enrolledClasses: fitnessClass._id } });

    return response.status(200).json({ message: "Booking cancelled!", class: fitnessClass });
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
};

const getMyClasses = async (request, response) => {
  try {
    const classes = await FitnessClass.find({ enrolledMembers: request.user._id }).sort({
      scheduleDate: 1,
    });
    return response.status(200).json({ count: classes.length, classes });
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
};

module.exports = {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  bookClass,
  cancelBooking,
  getMyClasses,
};
