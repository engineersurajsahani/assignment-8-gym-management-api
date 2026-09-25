const express = require('express');
const router = express.Router();
const { renewMembership, getExpiredMembers } = require('../controllers/memberController');

// @route   GET /api/members/expired
// @desc    Get list of all members with expired memberships
// @access  Public / Admin (Mounted before /:id/renew so 'expired' is not interpreted as an ID)
router.get('/expired', getExpiredMembers);

// @route   PATCH /api/members/:id/renew
// @desc    Renew or extend membership expiry date & optionally update tier
// @access  Public / Admin
router.patch('/:id/renew', renewMembership);

module.exports = router;
