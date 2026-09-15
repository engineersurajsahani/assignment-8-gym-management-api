const User = require('../models/User');

const checkActiveMember = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Please log in first.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    const now = new Date();
    const expiry = new Date(user.membershipExpiryDate);

    if (user.membershipStatus !== 'active' || expiry < now) {
      if (expiry < now && user.membershipStatus === 'active') {
        user.membershipStatus = 'expired';
        await user.save();
      }

      return res.status(400).json({
        error: 'Membership is expired or inactive. Class booking allowed for active members only.',
        membershipStatus: user.membershipStatus,
        membershipExpiryDate: user.membershipExpiryDate
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { checkActiveMember };
