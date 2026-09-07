const express = require('express');
const controller = require('../controllers/classController');
const authMiddleware = require('../middleware/authMiddleware');
const checkActiveMember = require('../middleware/checkActiveMember');

const router = express.Router();

router.get('/', controller.getClasses);
router.get('/:id', controller.getClassById);
router.post('/', controller.createClass);
router.post('/:id/book', authMiddleware, checkActiveMember, controller.bookClass);
router.delete('/:id/cancel', authMiddleware, controller.cancelBooking);

module.exports = router;
