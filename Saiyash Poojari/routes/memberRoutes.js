const express = require('express');
const router = express.Router();
const { renewMembership, getExpiredMembers } = require('../controllers/memberController');

router.get('/expired', getExpiredMembers);
router.patch('/:id/renew', renewMembership);

module.exports = router;
