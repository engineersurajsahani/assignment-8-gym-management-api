const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }

    if (req.session && req.user) {
      return next();
    }

    const header = req.headers['authorization'] || req.headers['x-user-id'];
    if (header) {
      const id = header.startsWith('Bearer ') ? header.slice(7).trim() : header.trim();
      if (id) {
        const usr = await User.findById(id).select('-password');
        if (usr) {
          req.user = usr;
          return next();
        }
      }
    }

    return res.status(401).json({ success: false, message: 'Unauthorized: Please login first' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = authMiddleware;
