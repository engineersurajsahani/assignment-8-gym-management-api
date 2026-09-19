const User = require('../models/User');

const renewMembership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { additionalMonths = 1, tier } = req.body;

    const usr = await User.findById(id);
    if (!usr) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const months = Number(additionalMonths) || 1;
    const now = new Date();
    const currentExpiry = new Date(usr.membershipExpiryDate);

    let baseDate = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseDate.getTime() + months * 30 * 24 * 60 * 60 * 1000);

    usr.membershipExpiryDate = newExpiry;
    usr.membershipStatus = 'active';

    if (tier) {
      usr.membershipTier = tier;
    }

    await usr.save();

    const safe = usr.toObject();
    delete safe.password;

    return res.status(200).json({
      success: true,
      message: 'Membership renewed successfully',
      data: safe
    });
  } catch (err) {
    next(err);
  }
};

const getExpiredMembers = async (req, res, next) => {
  try {
    const now = new Date();
    const list = await User.find({
      $or: [{ membershipExpiryDate: { $lt: now } }, { membershipStatus: 'expired' }]
    }).select('-password');

    return res.status(200).json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { renewMembership, getExpiredMembers };
