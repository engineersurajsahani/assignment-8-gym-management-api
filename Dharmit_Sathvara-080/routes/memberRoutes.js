const express = require('express');
const memberController = require('../controllers/memberController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/expired', authMiddleware, memberController.getExpiredMembers);
router.patch('/:id/renew', authMiddleware, memberController.renewMembership);

module.exports = router;
