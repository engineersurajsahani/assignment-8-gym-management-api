const mongoose = require('mongoose');
const User = require('../models/User');
const { getSafeUser } = require('./authController');

const VALID_TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum'];
const DAYS_PER_MONTH = 30; // Assignment rule: 30 days per month.

// ------------------------------------------------------------------
// PATCH /api/members/:id/renew
// Body: { additionalMonths, tier }
// Extends a membership. Uses the same 30-days-per-month rule:
//   - Active membership  -> extends from the existing expiry date.
//   - Expired membership -> renewal starts from TODAY.
// ------------------------------------------------------------------
const renewMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const { additionalMonths, tier } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid member id' });
    }

    // ---- Validate inputs -------------------------------------------
    const months = Number(additionalMonths);
    if (!months || months < 1 || !Number.isInteger(months)) {
      return res.status(400).json({ message: 'additionalMonths must be a positive integer' });
    }
    if (tier && !VALID_TIERS.includes(tier)) {
      return res.status(400).json({
        message: `tier must be one of: ${VALID_TIERS.join(', ')}`
      });
    }

    // ---- Find the member -------------------------------------------
    const member = await User.findById(id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // ---- Calculate the new expiry date ------------------------------
    // Start from the current expiry if it is still in the future,
    // otherwise (expired membership) start from today.
    const baseDate = member.membershipExpiryDate > new Date()
      ? new Date(member.membershipExpiryDate)
      : new Date();

    baseDate.setDate(baseDate.getDate() + months * DAYS_PER_MONTH);

    member.membershipExpiryDate = baseDate;
    if (tier) {
      member.membershipTier = tier;
    }
    member.membershipStatus = 'active';

    await member.save();

    return res.status(200).json({
      message: 'Membership renewed successfully',
      member: getSafeUser(member)
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Server error while renewing membership' });
  }
};

// ------------------------------------------------------------------
// GET /api/members/expired
// Returns all members whose expiry date is before today. Before
// returning, each matching member's status is synced to "expired".
// ------------------------------------------------------------------
const getExpiredMembers = async (req, res) => {
  try {
    const expiredUsers = await User.find({
      membershipExpiryDate: { $lt: new Date() }
    });

    // Patch stored status so the database always reflects reality.
    let updated = false;
    for (const user of expiredUsers) {
      if (user.membershipStatus !== 'expired') {
        user.membershipStatus = 'expired';
        await user.save();
        updated = true;
      }
    }
    if (updated) {
      // Re-fetch so the response contains the corrected statuses.
      const refreshed = await User.find({
        membershipExpiryDate: { $lt: new Date() }
      });
      return res.status(200).json({
        count: refreshed.length,
        members: refreshed.map(getSafeUser)
      });
    }

    return res.status(200).json({
      count: expiredUsers.length,
      members: expiredUsers.map(getSafeUser)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error while fetching expired members' });
  }
};

module.exports = { renewMembership, getExpiredMembers };