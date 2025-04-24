// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No token provided or invalid format');
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('Token is empty');
      return res.status(401).json({
        success: false,
        message: 'Authentication token is missing'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Add user from payload to request
      req.user = decoded;
      
      // Optionally check if user still exists in database
      const user = await User.findById(decoded.id);
      if (!user) {
        console.log('User not found in database');
        return res.status(401).json({
          success: false,
          message: 'User no longer exists'
        });
      }
      
      console.log(`Auth successful for user ID: ${decoded.id}`);
      next();
    } catch (tokenError) {
      console.log('Token verification failed:', tokenError.message);
      
      // Handle expired tokens differently
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired',
          expired: true
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};
