const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const requireAdminAuth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Invalid token or admin account disabled' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireSuperAdmin = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.admin.role !== 'superadmin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  
  next();
};

const requireAdminOrSuperAdmin = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!['admin', 'superadmin'].includes(req.admin.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

module.exports = { requireAdminAuth, requireSuperAdmin, requireAdminOrSuperAdmin };
