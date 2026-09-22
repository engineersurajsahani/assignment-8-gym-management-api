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

// GET /api/classes — list upcoming classes (optional ?trainer= filter).
router.get('/', getClasses);

// GET /api/classes/:id — class details with enrolled members populated.
router.get('/:id', getClassById);

// POST /api/classes — create a class.
router.post('/', createClass);

// POST /api/classes/:id/book — book a class (auth + active membership).
router.post('/:id/book', authMiddleware, checkActiveMember, bookClass);

// DELETE /api/classes/:id/cancel — cancel a booking (auth only).
router.delete('/:id/cancel', authMiddleware, cancelBooking);

module.exports = router;