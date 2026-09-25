const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

// @route   GET /api/members/expired - Get all members with expired memberships
router.get('/expired', memberController.getExpiredMembers);

// @route   PATCH /api/members/:id/renew - Renew member subscription
router.patch('/:id/renew', ensureAuthenticated, memberController.renewMembership);

module.exports = router;
