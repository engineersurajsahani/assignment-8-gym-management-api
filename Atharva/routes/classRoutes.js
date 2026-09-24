const express = require('express');
const { getClasses, getClassById, createClass, bookClass, cancelBooking } = require('../controllers/classController');
const authMiddleware = require('../middleware/authMiddleware');
const checkActiveMember = require('../middleware/checkActiveMember');

const router = express.Router();

router.get('/', getClasses);
router.get('/:id', getClassById);

router.post('/', createClass); 

// Booking requires authentication and an active membership
router.post('/:id/book', authMiddleware, checkActiveMember, bookClass);

// Canceling requires authentication
router.delete('/:id/cancel', authMiddleware, cancelBooking);

module.exports = router;
