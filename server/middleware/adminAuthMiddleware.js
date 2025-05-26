const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const requireAdminAuth = async (req, res, next) => {
  
};

const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.admin.role === 'superadmin') {
      return next();
    }

    if (req.admin.permissions[permission]) {
      return next();
    }
    
    res.status(403).json({ error: 'Permission denied' });
  };
};

module.exports = { requireAdminAuth, checkPermission };
