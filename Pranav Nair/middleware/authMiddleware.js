/**
 * Ensures the user is authenticated via session.
 */
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Unauthorized. Please log in.',
  });
};

module.exports = { ensureAuthenticated };
