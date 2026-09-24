// makes sure user is logged in before hitting protected routes
const authMiddleware = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Please login first" });
};

module.exports = authMiddleware;
