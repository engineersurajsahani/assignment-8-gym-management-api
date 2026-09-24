// blocks the request if the logged in members plan has expired
const checkActiveMember = async (req, res, next) => {
  const user = req.user;

  if (user.membershipExpiryDate < new Date()) {
    user.membershipStatus = "expired";
    await user.save();
    return res.status(400).json({ message: "Your membership has expired, please renew" });
  }

  next();
};

module.exports = checkActiveMember;
