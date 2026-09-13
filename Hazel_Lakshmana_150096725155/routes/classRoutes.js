const express = require('express');
const {
  getClasses,
  getClassById,
  createClass,
  bookClass,
  cancelBooking
} = require('../controllers/classController');
const requireAuth = require('../middleware/authMiddleware');
const checkActiveMember = require('../middleware/checkActiveMember');

const router = express.Router();

router.get('/', getClasses);
router.get('/:id', getClassById);
router.post('/', createClass);
router.post('/:id/book', requireAuth, checkActiveMember, bookClass);
router.delete('/:id/cancel', requireAuth, cancelBooking);

module.exports = router;
