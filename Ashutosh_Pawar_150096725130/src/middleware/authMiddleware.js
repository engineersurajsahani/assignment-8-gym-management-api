const isAuthenticated = (request, response, next) => {
  if (request.isAuthenticated()) {
    return next();
  }
  return response.status(401).json({ message: "Please login first!" });
};

const isAdmin = (request, response, next) => {
  if (request.user.role !== "admin") {
    return response.status(403).json({ message: "Admins only!" });
  }
  next();
};

module.exports = { isAuthenticated, isAdmin };
