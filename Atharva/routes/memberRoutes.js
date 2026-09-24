const express = require('express');
const { renewMembership, getExpiredMemberships } = require('../controllers/memberController');

const router = express.Router();

router.patch('/:id/renew', renewMembership);
router.get('/expired', getExpiredMemberships);

module.exports = router;
