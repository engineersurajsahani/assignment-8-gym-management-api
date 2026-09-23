/**
 * Middleware to ensure the user is authenticated via Passport session
 */
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Unauthorized: Please log in to access this resource'
  });
};

module.exports = ensureAuthenticated;
