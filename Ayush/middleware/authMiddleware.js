
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Unauthorized: please log in' });
};

module.exports = ensureAuthenticated;
