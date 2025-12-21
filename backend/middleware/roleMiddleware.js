const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {

    // 1. Check if user is authenticated
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        message: 'User not authenticated',
      });
    }

    // 2. Get user role
    const role = req.user.role;

    // 3. Check if role is allowed
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        message: 'Unauthorized access',
      });
    }

    // 4. Role allowed → proceed
    next();
  };
};

module.exports = { authorizeRoles };
