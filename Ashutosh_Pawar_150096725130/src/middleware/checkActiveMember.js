const checkActiveMember = async (request, response, next) => {
  try {
    const user = request.user;

    if (user.membershipStatus === "frozen") {
      return response.status(400).json({ message: "Membership is frozen!" });
    }

    if (user.isExpired()) {
      if (user.membershipStatus !== "expired") {
        await user.save();
      }
      return response
        .status(400)
        .json({ message: "Membership expired! Please renew to book classes." });
    }

    next();
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
};

module.exports = checkActiveMember;
