const express = require('express');
const router = express.Router();
const {
  getAllClasses,
  getClassById,
  createClass,
  bookClass,
  cancelBooking
} = require('../controllers/classController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const { checkActiveMember } = require('../middleware/checkActiveMember');

// @route   GET /api/classes
// @desc    Fetch all workout classes (supports ?trainer=John filter)
// @access  Public
router.get('/', getAllClasses);

// @route   GET /api/classes/:id
// @desc    Get single class details with populated enrolled members list
// @access  Public
router.get('/:id', getClassById);

// @route   POST /api/classes
// @desc    Create a new workout class
// @access  Public / Admin
router.post('/', createClass);

// @route   POST /api/classes/:id/book
// @desc    Enroll logged-in user into class (rejects if full or expired)
// @access  Private (Session authenticated)
router.post('/:id/book', ensureAuthenticated, checkActiveMember, bookClass);

// @route   DELETE /api/classes/:id/cancel
// @desc    Cancel logged-in user's booking for class
// @access  Private (Session authenticated)
router.delete('/:id/cancel', ensureAuthenticated, cancelBooking);

module.exports = router;
