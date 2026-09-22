// ------------------------------------------------------------------
// authMiddleware
// Protects endpoints that require a logged-in user.
// If the Passport session is missing the user, we reply with 401.
// ------------------------------------------------------------------
module.exports = function authMiddleware(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Authentication required' });
};