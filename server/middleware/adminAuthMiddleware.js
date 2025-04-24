const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const requireAdminAuth = async (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find admin by ID
    const admin = await Admin.findById(decoded.id);
    
    if (!admin) {
      return res.status(401).json({ error: 'Not authorized' });
    }
    
    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({ error: 'Admin account is disabled' });
    }
    
    // Add admin object to request
    req.admin = {
      id: admin._id,
      role: admin.role,
      permissions: admin.permissions
    };
    
    next();
  } catch (err) {
    console.error('Admin authentication error:', err);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'jwt expired' });
    }
    res.status(401).json({ error: 'Not authorized' });
  }
};

// Check if admin has specific permission
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Superadmin has all permissions
    if (req.admin.role === 'superadmin') {
      return next();
    }
    
    // Check for specific permission
    if (req.admin.permissions[permission]) {
      return next();
    }
    
    res.status(403).json({ error: 'Permission denied' });
  };
};

module.exports = { requireAdminAuth, checkPermission };
