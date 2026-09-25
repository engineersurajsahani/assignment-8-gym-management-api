const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const { checkActiveMember } = require('../middleware/checkActiveMember');

// @route   GET /api/classes - Fetch all classes
router.get('/', classController.getClasses);

// @route   GET /api/classes/:id - Get single class by ID
router.get('/:id', classController.getClassById);

// @route   POST /api/classes - Create new class
router.post('/', ensureAuthenticated, classController.createClass);

// @route   POST /api/classes/:id/book - Book class seat
router.post('/:id/book', ensureAuthenticated, checkActiveMember, classController.bookClass);

// @route   DELETE /api/classes/:id/cancel - Cancel class booking
router.delete('/:id/cancel', ensureAuthenticated, classController.cancelBooking);

module.exports = router;
