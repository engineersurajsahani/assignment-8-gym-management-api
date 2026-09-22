const express = require('express');

const { renewMembership, getExpiredMembers } = require('../controllers/memberController');

const router = express.Router();

// PATCH /api/members/:id/renew — extend a membership.
router.patch('/:id/renew', renewMembership);

// GET /api/members/expired — list all expired members.
router.get('/expired', getExpiredMembers);

module.exports = router;