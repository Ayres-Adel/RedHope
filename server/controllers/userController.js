// controllers/userController.js
const User = require('../models/User');
const mongoose = require('mongoose'); // Add mongoose import
const bcrypt = require('bcrypt');

module.exports = {
  // Get user profile
  getProfile: async (req, res) => {
    try {
      // Check if user is admin based on the role in the token
      const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
      let user;
      
      if (isAdmin) {
        // Find admin user
        const Admin = mongoose.model('Admin');
        user = await Admin.findById(req.user.userId)
          .select('-password -__v'); // Exclude sensitive fields
          
        if (!user) {
          return res.status(404).json({ error: 'Admin not found' });
        }
        
        return res.json({
          username: user.username,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          lastLogin: user.lastLogin,
          isAdmin: true
        });
      } else {
        // Regular user
        user = await User.findById(req.user.userId)
          .select('-password -__v'); // Exclude sensitive fields
      
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.json({
          username: user.username,
          email: user.email,
          phone: user.phoneNumber,
          bloodType: user.bloodType,
          location: user.location,
          dateOfBirth: user.dateOfBirth,
          isDonor: user.isDonor
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Change password
  changePassword: async (req, res) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

    try {
        // 1. Check if new passwords match
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ error: 'New passwords do not match' });
        }

        let user;
        // 2. Fetch user from appropriate model
        if (isAdmin) {
            const Admin = mongoose.model('Admin');
            user = await Admin.findById(req.user.userId);
        } else {
            user = await User.findById(req.user.userId);
        }
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 3. Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // 4. MANUALLY hash and save (to ensure pre-save hook runs)
        user.password = newPassword; // Set the new plaintext password
        await user.save(); // This triggers the pre('save') hook to hash it

        res.json({ message: 'Password changed successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
  },

  // Delete account
  deleteAccount: async (req, res) => {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    
    try {
      let user;
      
      if (isAdmin) {
        const Admin = mongoose.model('Admin');
        // Only superadmin can delete admin accounts, or admins can delete themselves
        if (req.user.role !== 'superadmin' && req.params.userId !== req.user.userId) {
          return res.status(403).json({ error: 'Not authorized to delete other admin accounts' });
        }
        
        user = await Admin.findByIdAndDelete(req.user.userId);
      } else {
        user = await User.findByIdAndDelete(req.user.userId);
      }
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'Account deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    
    res.status(200).json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
};

// Make sure these controller functions exist or add them
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, role, bloodType, isDonor, isActive } = req.body;
    
    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email and password'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create the user
    const user = new User({
      username,
      email,
      password,
      role: role || 'user',
      bloodType,
      isDonor: isDonor || false,
      isActive: isActive !== false
    });
    
    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        bloodType: user.bloodType,
        isDonor: user.isDonor,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
};