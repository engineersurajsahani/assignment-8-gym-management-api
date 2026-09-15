const User = require('../models/User');

const VALID_TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum'];

function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * PATCH /api/members/:id/renew
 * Extends membershipExpiryDate by additionalMonths from either the current
 * expiry (if still active) or from today (if already expired), and
 * optionally updates the tier.
 */
async function renewMembership(req, res) {
  try {
    const { additionalMonths, tier } = req.body;

    if (additionalMonths === undefined) {
      return res.status(400).json({ success: false, message: 'additionalMonths is required' });
    }
    const months = Number(additionalMonths);
    if (!Number.isFinite(months) || months <= 0) {
      return res.status(400).json({ success: false, message: 'additionalMonths must be a positive number' });
    }
    if (tier && !VALID_TIERS.includes(tier)) {
      return res.status(400).json({
        success: false,
        message: `tier must be one of: ${VALID_TIERS.join(', ')}`
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const baseDate = user.membershipExpiryDate && user.membershipExpiryDate > new Date()
      ? user.membershipExpiryDate
      : new Date();

    user.membershipExpiryDate = addMonths(baseDate, months);
    if (tier) user.membershipTier = tier;
    // membershipStatus is recalculated automatically by the pre-save hook

    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.status(200).json({ success: true, message: 'Membership renewed', data: safeUser });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/members/expired — members whose expiry date has passed
 */
async function listExpiredMembers(req, res) {
  try {
    const members = await User.find({
      membershipExpiryDate: { $lt: new Date() }
    })
      .select('-password')
      .sort({ membershipExpiryDate: 1 });

    return res.status(200).json({ success: true, count: members.length, data: members });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { renewMembership, listExpiredMembers };
