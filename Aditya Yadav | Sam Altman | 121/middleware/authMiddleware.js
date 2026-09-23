// middleware/authMiddleware.js
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Unauthorized: You must be logged in to access this resource'
  });
};

module.exports = ensureAuthenticated;
