const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Member not found.' });

    if (user.membershipExpiryDate < new Date()) {
      user.membershipStatus = 'expired';
      await user.save();
      return res.status(400).json({
        message: 'Membership expired. Please renew your membership.'
      });
    }

    if (user.membershipStatus === 'frozen') {
      return res.status(400).json({ message: 'Membership is currently frozen.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      message: 'Failed to verify membership status.',
      error: error.message
    });
  }
};
