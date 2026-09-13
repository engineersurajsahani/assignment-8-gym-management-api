const express = require('express');
const { renewMembership, getExpiredMembers } = require('../controllers/memberController');

const router = express.Router();

router.patch('/:id/renew', renewMembership);
router.get('/expired', getExpiredMembers);

module.exports = router;
