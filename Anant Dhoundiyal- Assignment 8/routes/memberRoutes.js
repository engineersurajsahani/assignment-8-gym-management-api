const express = require('express');
const router = express.Router();
const { renewMembership, listExpiredMembers } = require('../controllers/memberController');

// GET /api/members/expired — must be registered before /:id/renew to avoid
// "expired" being captured as an :id param
router.get('/expired', listExpiredMembers);

// PATCH /api/members/:id/renew
router.patch('/:id/renew', renewMembership);

module.exports = router;
