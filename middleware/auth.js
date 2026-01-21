const jwt = require('jsonwebtoken');

const auth = (roles = []) => {
  return (req, res, next) => {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    try {
      // Verify token
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'your_jwt_secret_key_here'
      );
      
      req.user = decoded;
      
      // Check role if specified
      if (roles.length > 0 && !roles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Insufficient permissions.'
        });
      }
      
      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token has expired. Please login again.'
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token.'
        });
      }
      
      return res.status(401).json({
        success: false,
        error: 'Authentication failed.'
      });
    }
  };
};

module.exports = auth;
