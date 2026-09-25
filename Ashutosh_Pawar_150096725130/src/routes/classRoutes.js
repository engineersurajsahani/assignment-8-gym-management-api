const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../middleware/authMiddleware");
const checkActiveMember = require("../middleware/checkActiveMember");
const {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  bookClass,
  cancelBooking,
  getMyClasses,
} = require("../controllers/classController");

router.get("/", getClasses);
router.get("/mine", isAuthenticated, getMyClasses);
router.get("/:id", getClassById);
router.post("/", isAuthenticated, isAdmin, createClass);
router.put("/:id", isAuthenticated, isAdmin, updateClass);
router.delete("/:id", isAuthenticated, isAdmin, deleteClass);
router.post("/:id/book", isAuthenticated, checkActiveMember, bookClass);
router.delete("/:id/cancel", isAuthenticated, cancelBooking);

module.exports = router;
