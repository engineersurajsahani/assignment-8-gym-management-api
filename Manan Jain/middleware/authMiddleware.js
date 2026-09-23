/**
 * Middleware to check if user is authenticated via Express Session / Passport
 */
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "Please login first"
  });
};

module.exports = isAuthenticated;
