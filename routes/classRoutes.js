const express = require('express');

const {
  getClasses,
  getClassById,
  createClass,
  bookClass,
  cancelBooking
} = require('../controllers/classController');

const authMiddleware = require('../middleware/authMiddleware');
const checkActiveMember = require('../middleware/checkActiveMember');

const router = express.Router();

// Get all classes
router.get('/', getClasses);

// Get one class
router.get('/:id', getClassById);

// Create a new class
router.post('/', authMiddleware, createClass);

// Book a class
router.post(
  '/:id/book',
  authMiddleware,
  checkActiveMember,
  bookClass
);

// Cancel a booking
router.delete(
  '/:id/cancel',
  authMiddleware,
  cancelBooking
);

module.exports = router;