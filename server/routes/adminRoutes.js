const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Import middleware correctly
const authMiddleware = require('../middleware/authMiddleware');
const requireAuth = authMiddleware.requireAuth || authMiddleware;

// Fallback middleware in case requireAuth is undefined
const fallbackAuth = (req, res, next) => {
  console.log('Using fallback auth middleware');
  next();
};

// Admin profile endpoint - with middleware check
router.get('/profile', requireAuth || fallbackAuth, (req, res) => {
  try {
    // Get Admin model
    const Admin = mongoose.models.Admin;
    
    if (!Admin) {
      return res.status(500).json({ error: 'Admin model not registered' });
    }
    
    // Get admin by ID
    Admin.findById(req.user.userId || req.user.id)
      .select('-password')
      .then(admin => {
        if (!admin) {
          return res.status(404).json({ error: 'Admin not found' });
        }
        
        // Return admin data - removed firstName, lastName
        res.json({
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions
        });
      })
      .catch(err => {
        console.error('Error finding admin:', err);
        res.status(500).json({ error: 'Database error' });
      });
  } catch (err) {
    console.error('Admin profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin dashboard stats - with middleware check
router.get('/stats', requireAuth || fallbackAuth, (req, res) => {
  try {
    const User = mongoose.models.User;
    
    // Get basic stats using Promise chain
    User.countDocuments()
      .then(totalUsers => {
        User.countDocuments({ isDonor: true })
          .then(totalDonors => {
            res.json({
              totalUsers,
              totalDonors,
              lastUpdated: new Date()
            });
          })
          .catch(err => {
            console.error('Error counting donors:', err);
            res.status(500).json({ error: 'Error counting donors' });
          });
      })
      .catch(err => {
        console.error('Error counting users:', err);
        res.status(500).json({ error: 'Error counting users' });
      });
  } catch (err) {
    console.error('Error getting admin stats:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add user stats endpoint - with middleware check
router.get('/user/stats', requireAuth || fallbackAuth, (req, res) => {
  try {
    res.json({
      totalUsers: 150,
      totalDonors: 85,
      activeUsers: 120,
      newUsersThisMonth: 24
    });
  } catch (err) {
    console.error('Error fetching user stats:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add donations stats endpoint - with middleware check
router.get('/donations/stats', requireAuth || fallbackAuth, (req, res) => {
  try {
    res.json({
      totalDonations: 95,
      pendingRequests: 12,
      completedDonations: 78,
      cancelledDonations: 5
    });
  } catch (err) {
    console.error('Error fetching donation stats:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add blood supply endpoint - with middleware check
router.get('/blood-supply', requireAuth || fallbackAuth, (req, res) => {
  try {
    res.json({
      'A+': 'stable',
      'A-': 'low',
      'B+': 'stable',
      'B-': 'critical',
      'AB+': 'stable',
      'AB-': 'low',
      'O+': 'stable',
      'O-': 'critical'
    });
  } catch (err) {
    console.error('Error fetching blood supply:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all admin accounts with pagination, filtering and sorting
router.get('/accounts', requireAuth || fallbackAuth, async (req, res) => {
  try {
    console.log('Admin accounts API endpoint called');
    
    // Extract query parameters with defaults
    const { 
      page = 1, 
      limit = 10, // Default limit
      search = '', 
      sortBy = 'createdAt', 
      sortOrder = -1, // Default descending order
      role = '' 
    } = req.query;
    
    // Get the Admin model properly
    const Admin = mongoose.model('Admin');
    
    if (!Admin) {
      console.error('Admin model not found in mongoose models');
      return res.status(500).json({ 
        success: false, 
        message: 'Admin model not registered' 
      });
    }
    
    // Build query filters
    const filter = {};
    
    // Search by username, email, or name if search term provided
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by role if specified
    if (role) {
      filter.role = role;
    }
    
    // Convert page and limit to numbers
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Validate sortOrder
    const sortOrderNum = parseInt(sortOrder, 10);
    const finalSortOrder = (sortOrderNum === 1 || sortOrderNum === -1) ? sortOrderNum : -1;

    // Count total matching documents for pagination
    const totalAdmins = await Admin.countDocuments(filter);
    const totalPages = Math.ceil(totalAdmins / limitNum);
    
    // Execute query with pagination and sorting
    const admins = await Admin.find(filter)
      .select('-password')
      .sort({ [sortBy]: finalSortOrder })
      .skip(skip)
      .limit(limitNum);
    
    console.log(`Found ${admins.length} admin accounts matching query on page ${pageNum}`);
    
    // Format admin accounts for response
    const formattedAdmins = admins.map(admin => ({
      id: admin._id,
      username: admin.username || `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || 'Unknown Admin',
      email: admin.email || 'No email',
      role: admin.role || 'admin',
      permissions: admin.permissions || {
        manageUsers: true,
        manageDonations: true,
        manageContent: admin.role === 'superadmin',
        manageSettings: admin.role === 'superadmin'
      },
      lastLogin: admin.lastLogin || null,
      isActive: admin.isActive !== false
    }));
    
    // Return success response with pagination data
    res.status(200).json({
      success: true,
      admins: formattedAdmins,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems: totalAdmins,
        totalPages
      }
    });
    
  } catch (err) {
    console.error('Error in /admin/accounts endpoint:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching admin accounts', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

// Get a single admin by ID
router.get('/accounts/:id', requireAuth || fallbackAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get Admin model
    const Admin = mongoose.model('Admin');
    
    if (!Admin) {
      return res.status(500).json({ 
        success: false, 
        message: 'Admin model not registered' 
      });
    }
    
    // Find the admin by ID
    const admin = await Admin.findById(id).select('-password');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    // Format and return the admin data - removed firstName, lastName
    res.status(200).json({
      success: true,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin,
        isActive: admin.isActive,
        createdAt: admin.createdAt
      }
    });
    
  } catch (err) {
    console.error('Error fetching admin by ID:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin details',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Create a new admin account
router.post('/accounts', requireAuth || fallbackAuth, async (req, res) => {
  try {
    // Extract admin data from request body - removed firstName, lastName
    const { username, email, password, role, permissions } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }
    
    // Get Admin model
    const Admin = mongoose.model('Admin');
    
    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email });
    
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Email is already in use'
      });
    }
    
    // Create new admin - removed firstName, lastName
    const newAdmin = new Admin({
      username,
      email,
      password, // Will be hashed by pre-save hook in model
      role: role || 'admin',
      permissions: permissions || {
        manageUsers: true,
        manageDonations: true,
        manageContent: role === 'superadmin',
        manageSettings: role === 'superadmin'
      }
    });
    
    // Save to database
    await newAdmin.save();
    
    // Return success without password
    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      admin: {
        id: newAdmin._id,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
    
  } catch (err) {
    console.error('Error creating admin account:', err);
    res.status(500).json({
      success: false,
      message: 'Error creating admin account',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Update an admin account
router.put('/accounts/:id', requireAuth || fallbackAuth, async (req, res) => {
  try {
    const { id } = req.params;
    // Removed firstName, lastName from destructuring
    const { username, email, role, isActive, permissions } = req.body;
    
    // Get Admin model
    const Admin = mongoose.model('Admin');
    
    // Find admin to update
    const admin = await Admin.findById(id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    // Check if email is being changed and already exists
    if (email && email !== admin.email) {
      const existingAdmin = await Admin.findOne({ email, _id: { $ne: id } });
      
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another admin'
        });
      }
    }
    
    // Update fields if provided - removed firstName, lastName
    if (username) admin.username = username;
    if (email) admin.email = email;
    if (role) admin.role = role;
    if (isActive !== undefined) admin.isActive = isActive;
    if (permissions) admin.permissions = { ...admin.permissions, ...permissions };
    
    // Save changes
    await admin.save();
    
    res.status(200).json({
      success: true,
      message: 'Admin account updated successfully',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        permissions: admin.permissions
      }
    });
    
  } catch (err) {
    console.error('Error updating admin account:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating admin account',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Delete an admin account
router.delete('/accounts/:id', requireAuth || fallbackAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get Admin model
    const Admin = mongoose.model('Admin');
    
    // Find and delete admin
    const admin = await Admin.findByIdAndDelete(id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Admin account deleted successfully',
      deletedAdminId: id
    });
    
  } catch (err) {
    console.error('Error deleting admin account:', err);
    res.status(500).json({
      success: false,
      message: 'Error deleting admin account',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Update admin permissions specifically
router.patch('/accounts/:id/permissions', requireAuth || fallbackAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    
    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Permissions object is required'
      });
    }
    
    // Get Admin model
    const Admin = mongoose.model('Admin');
    
    // Find the admin
    const admin = await Admin.findById(id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    // Update permissions
    admin.permissions = { ...admin.permissions, ...permissions };
    await admin.save();
    
    res.status(200).json({
      success: true,
      message: 'Admin permissions updated successfully',
      permissions: admin.permissions
    });
    
  } catch (err) {
    console.error('Error updating admin permissions:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating admin permissions',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Debug endpoint to check Admin model registration
router.get('/check-model', (req, res) => {
  try {
    const mongoose = require('mongoose');
    const modelNames = Object.keys(mongoose.models);
    
    // Check if Admin model is registered
    const adminModel = mongoose.models.Admin;
    const isAdminRegistered = !!adminModel;
    
    // Get registered models count
    const adminCount = isAdminRegistered ? 
      'Counting admins...' : 
      'Cannot count, Admin model not registered';
      
    // Try to count admins if model exists
    let countPromise = Promise.resolve(0);
    if (isAdminRegistered) {
      countPromise = adminModel.countDocuments();
    }
    
    // Return the count when ready
    countPromise.then(count => {
      res.json({
        success: true,
        registeredModels: modelNames,
        isAdminModelRegistered: isAdminRegistered,
        adminModelName: isAdminRegistered ? adminModel.modelName : null,
        adminCount: isAdminRegistered ? count : null
      });
    }).catch(err => {
      res.status(500).json({
        success: false,
        message: 'Error counting admins',
        error: err.message
      });
    });
    
  } catch (err) {
    console.error('Error checking Admin model:', err);
    res.status(500).json({
      success: false,
      message: 'Server error checking Admin model',
      error: err.message
    });
  }
});

module.exports = router;
