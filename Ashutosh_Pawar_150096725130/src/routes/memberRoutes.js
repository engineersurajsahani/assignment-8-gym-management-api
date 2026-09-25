const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../middleware/authMiddleware");
const { renewMembership, getExpiredMembers } = require("../controllers/memberController");

router.get("/expired", isAuthenticated, isAdmin, getExpiredMembers);
router.patch("/:id/renew", isAuthenticated, renewMembership);

module.exports = router;
