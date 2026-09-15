const express = require('express');
const router = express.Router();
const { renewMembership, getExpiredMembers } = require('../controllers/memberController');

router.patch('/:id/renew', renewMembership);
router.get('/expired', getExpiredMembers);

module.exports = router;