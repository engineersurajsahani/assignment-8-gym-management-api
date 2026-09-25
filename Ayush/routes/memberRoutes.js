const express = require('express');
const router = express.Router();
const { renewMembership, getExpiredMembers } = require('../controllers/memberController');
const ensureAuthenticated = require('../middleware/authMiddleware');

router.get('/expired', ensureAuthenticated, getExpiredMembers);
router.patch('/:id/renew', ensureAuthenticated, renewMembership);

module.exports = router;
