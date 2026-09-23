const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');

// Specific static route must precede parameterized /:id route
router.get('/expired', memberController.getExpiredMembers);
router.get('/', memberController.getAllMembers);
router.patch('/:id/renew', memberController.renewMembership);

module.exports = router;
