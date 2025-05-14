// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose'); // Import mongoose

module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is missing'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Add decoded payload to request (contains id and role)
      req.user = decoded; 
      
      let entity = null;
      const entityId = decoded.id;
      const entityRole = decoded.role;

      // Check if user/admin still exists in the database based on role
      if (entityRole === 'admin' || entityRole === 'superadmin') {
        const Admin = mongoose.models.Admin; // Get Admin model safely
        if (Admin) {
          entity = await Admin.findById(entityId);
        }
        if (!entity) {
          return res.status(401).json({
            success: false,
            message: 'Admin account not found or invalid token' 
          });
        }
      } else {
        // Assume 'user' role if not admin/superadmin
        entity = await User.findById(entityId);
        if (!entity) {
          return res.status(401).json({
            success: false,
            message: 'User no longer exists' 
          });
        }
      }
      
      // Attach essential user info (like ID and role) to req.user for downstream use
      // Ensure req.user has a consistent structure if needed by other middleware/routes
      req.user = { 
          id: entity._id, 
          userId: entity._id, // Add userId for compatibility if needed
          role: entity.role || entityRole // Use role from DB or token
          // Add other fields if necessary, e.g., permissions for admins
      };
      
      next();
    } catch (tokenError) {
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
