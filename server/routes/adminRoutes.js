const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');


const authMiddleware = require('../middleware/authMiddleware');
const requireAuth = authMiddleware.requireAuth || authMiddleware;


const fallbackAuth = (req, res, next) => {
  next();
};


router.get('/profile', requireAuth || fallbackAuth, (req, res) => {
  try {
    Admin.findById(req.user.userId || req.user.id)
      .select('-password')
      .then(admin => {
        res.json({
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        });
      })
      .catch(err => {
        console.error('Error fetching admin profile:', err);
        res.status(500).json({ error: 'Server error' });
      });
  } catch (err) {
    console.error('Error in admin profile route:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/stats', requireAuth || fallbackAuth, (req, res) => {
  try {
    const User = mongoose.models.User;
    

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


router.get('/accounts', requireAuth || fallbackAuth, async (req, res) => {
  try {

    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      sortBy = 'createdAt', 
      sortOrder = -1, 
      role = '' 
    } = req.query;
    

    const Admin = mongoose.model('Admin');
    
    if (!Admin) {
      console.error('Admin model not found in mongoose models');
      return res.status(500).json({ 
        success: false, 
        message: 'Admin model not registered' 
      });
    }
    

    const filter = {};
    

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }
    

    if (role) {
      filter.role = role;
    }
    

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    

    const sortOrderNum = parseInt(sortOrder, 10);
    const finalSortOrder = (sortOrderNum === 1 || sortOrderNum === -1) ? sortOrderNum : -1;


    const totalAdmins = await Admin.countDocuments(filter);
    const totalPages = Math.ceil(totalAdmins / limitNum);
    

    const admins = await Admin.find(filter)
      .select('-password')
      .sort({ [sortBy]: finalSortOrder })
      .skip(skip)
      .limit(limitNum);
    

    const formattedAdmins = admins.map(admin => ({
      id: admin._id,
      username: admin.username || `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || 'Unknown Admin',
      email: admin.email || 'No email',
      role: admin.role || 'admin',
      lastLogin: admin.lastLogin || null,
      isActive: admin.isActive !== false
    }));
    

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


router.get('/accounts/:id', requireAuth || fallbackAuth, async (req, res) => {
  try {
    const { id } = req.params;
    

    const Admin = mongoose.model('Admin');
    
    if (!Admin) {
      return res.status(500).json({ 
        success: false, 
        message: 'Admin model not registered' 
      });
    }
    

    const admin = await Admin.findById(id).select('-password');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    

    res.status(200).json({
      success: true,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
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


router.post('/accounts', requireAuth || fallbackAuth, async (req, res) => {
  try {

    const { username, email, password, role } = req.body;
    

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }
    

    const Admin = mongoose.model('Admin');
    

    const existingAdmin = await Admin.findOne({ email });
    
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Email is already in use'
      });
    }
    

    const newAdmin = new Admin({
      username,
      email,
      password, 
      role: role || 'admin'
    });
    

    await newAdmin.save();
    

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


router.put('/accounts/:id', requireAuth || fallbackAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { username, email, role, isActive } = req.body;
    

    const Admin = mongoose.model('Admin');
    

    const admin = await Admin.findById(id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    

    if (email && email !== admin.email) {
      const existingAdmin = await Admin.findOne({ email, _id: { $ne: id } });
      
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another admin'
        });
      }
    }
    

    if (username) admin.username = username;
    if (email) admin.email = email;
    if (role) admin.role = role;
    if (isActive !== undefined) admin.isActive = isActive;
    

    await admin.save();
    
    res.status(200).json({
      success: true,
      message: 'Admin account updated successfully',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive
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


router.delete('/accounts/:id', requireAuth || fallbackAuth, async (req, res) => {
  try {
    const { id } = req.params;
    

    const Admin = mongoose.model('Admin');
    

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


router.get('/check-model', (req, res) => {
  try {
    const mongoose = require('mongoose');
    const modelNames = Object.keys(mongoose.models);
    

    const adminModel = mongoose.models.Admin;
    const isAdminRegistered = !!adminModel;
    

    const adminCount = isAdminRegistered ? 
      'Counting admins...' : 
      'Cannot count, Admin model not registered';
      

    let countPromise = Promise.resolve(0);
    if (isAdminRegistered) {
      countPromise = adminModel.countDocuments();
    }
    

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

// Add donation stats route for admin dashboard
router.get('/stats/donations', authMiddleware);

module.exports = router;
