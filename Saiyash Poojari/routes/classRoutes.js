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

router.get('/', getAllClasses);
router.get('/:id', getClassById);
router.post('/', createClass);
router.post('/:id/book', ensureAuthenticated, checkActiveMember, bookClass);
router.delete('/:id/cancel', ensureAuthenticated, cancelBooking);

module.exports = router;
