const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  try {
    // Read authorization header safely
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: 'No token, authorization denied',
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Invalid token format',
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded payload to request
    req.user = decoded;

    // Continue
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Token is not valid',
    });
  }
};

module.exports = { protect };
