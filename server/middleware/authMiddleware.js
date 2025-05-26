
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose'); 

module.exports = async (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }
    

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is missing'
      });
    }
    
    try {

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      

      req.user = decoded; 
      
      let entity = null;
      const entityId = decoded.id;
      const entityRole = decoded.role;


      if (entityRole === 'admin' || entityRole === 'superadmin') {
        const Admin = mongoose.models.Admin; 
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

        entity = await User.findById(entityId);
        if (!entity) {
          return res.status(401).json({
            success: false,
            message: 'User no longer exists' 
          });
        }
      }
      

      req.user = { 
          id: entity._id, 
          userId: entity._id, 
          role: entity.role || entityRole 

      };
      
      next();
    } catch (tokenError) {

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
