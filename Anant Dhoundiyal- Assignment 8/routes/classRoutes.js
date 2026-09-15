const express = require('express');
const router = express.Router();
const { listClasses, getClass, createClass, bookClass, cancelBooking } = require('../controllers/classController');
const authMiddleware = require('../middleware/authMiddleware');
const checkActiveMember = require('../middleware/checkActiveMember');

// GET /api/classes?trainer=
router.get('/', listClasses);

// GET /api/classes/:id
router.get('/:id', getClass);

// POST /api/classes
router.post('/', createClass);

// POST /api/classes/:id/book (requires login + active membership)
router.post('/:id/book', authMiddleware, checkActiveMember, bookClass);

// DELETE /api/classes/:id/cancel (requires login)
router.delete('/:id/cancel', authMiddleware, cancelBooking);

module.exports = router;
