/**
 * Ensures the request comes from a Passport-authenticated session.
 */
function authMiddleware(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'You must be logged in to perform this action' });
}

module.exports = authMiddleware;
