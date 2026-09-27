const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const authMiddleware = require('../middleware/authMiddleware');
const checkActiveMember = require('../middleware/checkActiveMember');

router.get('/', classController.getClasses);
router.get('/:id', classController.getClassById);
router.post('/', authMiddleware, classController.createClass);
router.post('/:id/book', authMiddleware, checkActiveMember, classController.bookClass);
router.delete('/:id/cancel', authMiddleware, classController.cancelBooking);

module.exports = router;
