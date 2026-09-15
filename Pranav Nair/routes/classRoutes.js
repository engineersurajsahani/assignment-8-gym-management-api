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

// GET /api/classes
router.get('/', getAllClasses);

// GET /api/classes/:id
router.get('/:id', getClassById);

// POST /api/classes
router.post('/', ensureAuthenticated, createClass);

// POST /api/classes/:id/book
router.post('/:id/book', ensureAuthenticated, checkActiveMember, bookClass);

// DELETE /api/classes/:id/cancel
router.delete('/:id/cancel', ensureAuthenticated, cancelBooking);

module.exports = router;
