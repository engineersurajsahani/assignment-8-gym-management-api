const express = require("express");
const User = require("../model/User");

const router = express.Router();

/**
 * @route PATCH /api/members/:id/renew
 * @desc Renew or extend a member's membership
 * @access Public (In real app, this might be restricted to Admins or the user themselves)
 */
router.patch("/:id/renew", async (req, res) => {
  try {
    const { additionalMonths, tier } = req.body;

    if (!additionalMonths) {
      return res.status(400).json({
        success: false,
        message: "Please provide additionalMonths"
      });
    }

    const member = await User.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    const now = new Date();
    const currentExpiry = new Date(member.membershipExpiryDate);

    // If membership is active and expiry is in the future, extend from current expiry
    // If expired, extend from today
    let baseDate = currentExpiry > now ? currentExpiry : now;
    
    baseDate.setMonth(baseDate.getMonth() + parseInt(additionalMonths));

    member.membershipExpiryDate = baseDate;
    member.membershipStatus = "active"; // Restore status if it was expired

    if (tier) {
      member.membershipTier = tier;
    }

    await member.save();

    // Prepare response without password
    const memberResponse = member.toObject();
    delete memberResponse.password;

    res.status(200).json({
      success: true,
      message: "Membership renewed successfully",
      data: memberResponse
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message
    });
  }
});

/**
 * @route GET /api/members/expired
 * @desc Get all members whose membership has expired
 * @access Public (could be admin only)
 */
router.get("/expired", async (req, res) => {
  try {
    const now = new Date();

    // Find all users where expiry date is strictly in the past
    const expiredMembers = await User.find({
      membershipExpiryDate: { $lt: now }
    }).select("-password");

    // Optional: Synchronize their status in the DB
    await User.updateMany(
      { membershipExpiryDate: { $lt: now }, membershipStatus: { $ne: "expired" } },
      { $set: { membershipStatus: "expired" } }
    );

    res.status(200).json({
      success: true,
      message: "Expired members fetched successfully",
      data: expiredMembers
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message
    });
  }
});

module.exports = router;
