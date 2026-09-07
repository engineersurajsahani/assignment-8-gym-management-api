const express = require('express');
const controller = require('../controllers/memberController');

const router = express.Router();

router.patch('/:id/renew', controller.renewMembership);
router.get('/expired', controller.getExpiredMembers);

module.exports = router;
