const User = require('../models/User');

// Middleware to check if user is an admin
const isAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    const user = await User.findById(req.user.userId);
    
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin privileges required' 
      });
    }
    
    // Add admin info to request for further use
    req.admin = {
      role: user.role,
      permissions: user.adminPermissions
    };
    
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error in authentication' 
    });
  }
};

module.exports = (req, res, next) => {
  try {
    // Check if user exists in request (set by authMiddleware)
    if (!req.user) {
      // Don't block
      return next();
    }

    // Check if user has admin or superadmin role
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    
    // Add admin status to request object
    req.isAdmin = isAdmin;
    
    next();
  } catch (err) {
    console.error('Error in admin middleware:', err);
    // Don't block on errors in middleware
    next();
  }
};

// Middleware to check specific admin permissions
const hasPermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.admin) {
        // Run admin middleware first if not already run
        return isAdmin(req, res, () => checkPermission());
      } else {
        return checkPermission();
      }
      
      function checkPermission() {
        if (req.admin.role === 'superadmin' || req.admin.permissions[permission]) {
          next();
        } else {
          res.status(403).json({ 
            success: false, 
            message: `You don't have ${permission} permission` 
          });
        }
      }
    } catch (error) {
      console.error('Permission middleware error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error checking permissions' 
      });
    }
  };
};

module.exports = { isAdmin, hasPermission };
