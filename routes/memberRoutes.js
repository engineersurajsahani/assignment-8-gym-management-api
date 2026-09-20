const express = require('express');

const {
  renewMembership,
  getExpiredMembers
} = require('../controllers/memberController');

const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Renew membership
router.patch('/:id/renew', authMiddleware, renewMembership);

// Get expired members
router.get('/expired', authMiddleware, getExpiredMembers);

module.exports = router;