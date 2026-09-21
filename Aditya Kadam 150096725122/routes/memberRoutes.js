const express = require('express');
const memberController = require('../controllers/memberController');
const { isAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();

router.patch('/:id/renew', isAuthenticated, memberController.renewMembership);

router.get('/expired', isAuthenticated, memberController.getExpiredMemberships);

module.exports = router;
