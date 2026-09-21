const express = require('express');
const classController = require('../controllers/classController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const { checkActiveMember } = require('../middleware/checkActiveMember');

const router = express.Router();

router.get('/', isAuthenticated, classController.getUpcomingClasses);

router.get('/:id', isAuthenticated, classController.getClassById);

router.post('/', isAuthenticated, classController.createClass);

router.post('/:id/book', isAuthenticated, checkActiveMember, classController.bookClass);

router.delete('/:id/cancel', isAuthenticated, classController.cancelBooking);

module.exports = router;
