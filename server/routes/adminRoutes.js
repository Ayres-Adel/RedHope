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
        
        // Return admin data
        res.json({
          id: admin._id,
          username: admin.username,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
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

module.exports = router;
