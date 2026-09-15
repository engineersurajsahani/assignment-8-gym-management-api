const express = require('express');
const router = express.Router();
const { renewMembership, getExpiredMembers, getMemberById } = require('../controllers/memberController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

// PATCH /api/members/:id/renew
router.patch('/:id/renew', ensureAuthenticated, renewMembership);

// GET /api/members/expired
router.get('/expired', getExpiredMembers);

// GET /api/members/:id
router.get('/:id', ensureAuthenticated, getMemberById);

module.exports = router;
