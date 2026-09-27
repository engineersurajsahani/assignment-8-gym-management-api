const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const authMiddleware = require('../middleware/authMiddleware');

router.patch('/:id/renew', authMiddleware, memberController.renewMembership);
router.get('/expired', authMiddleware, memberController.getExpiredMembers);

module.exports = router;
