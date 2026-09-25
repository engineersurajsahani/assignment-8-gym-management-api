const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");
const { getMe, logoutUser } = require("../controllers/authController");
const { isAuthenticated } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", isAuthenticated, getMe);
router.post("/logout", logoutUser);

module.exports = router;
