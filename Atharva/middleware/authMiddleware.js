const authMiddleware = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
};

module.exports = authMiddleware;
