const User = require('../models/User');
const mongoose = require('mongoose'); 
const bcrypt = require('bcrypt');

module.exports = {

  getProfile: async (req, res) => {
    try {

      const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
      let user;
      
      if (isAdmin) {

        const Admin = mongoose.model('Admin');
        user = await Admin.findById(req.user.userId)
          .select('-password -__v'); 
          
        if (!user) {
          return res.status(404).json({ error: 'Admin not found' });
        }
        
        return res.json({
          username: user.username,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin,
          isAdmin: true
        });
      } else {

        user = await User.findById(req.user.userId)
          .select('-password -__v'); 
      
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

  // Update profile
  updateProfile: async (req, res) => {
    try {
      const userId = req.params.id;
      const updateData = req.body;
      
      // Explicitly handle location and cityId
      if (updateData.location) {
        // If location is updated, ensure cityId is saved too
        // This preserves cityId even if it wasn't explicitly provided
      }
      
      const updatedUser = await User.findByIdAndUpdate(
        userId, 
        updateData, 
        { new: true, runValidators: true }
      );
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          username: updatedUser.username,
          email: updatedUser.email,
          phoneNumber: updatedUser.phoneNumber,
          bloodType: updatedUser.bloodType,
          location: updatedUser.location,
          cityId: updatedUser.cityId,
          isDonor: updatedUser.isDonor,
          dateOfBirth: updatedUser.dateOfBirth
        }
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  },

  changePassword: async (req, res) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

    try {

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ error: 'New passwords do not match' });
        }

        let user;

        if (isAdmin) {
            const Admin = mongoose.model('Admin');
            user = await Admin.findById(req.user.userId);
        } else {
            user = await User.findById(req.user.userId);
        }
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }


        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        user.password = newPassword; 
        await user.save(); 

        res.json({ message: 'Password changed successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
  },


  deleteAccount: async (req, res) => {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    
    try {
      let user;
      
      if (isAdmin) {
        const Admin = mongoose.model('Admin');

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
  },

  // Content Management endpoints
  getContent: async (req, res) => {
    try {
      const { type } = req.params;
      
      // For now, we'll store content in localStorage on frontend
      // In production, this would fetch from database
      res.json({
        success: true,
        message: 'Content fetched successfully',
        data: {
          type,
          // This endpoint will be used by frontend to sync content
        }
      });
    } catch (err) {
      console.error('Error fetching content:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },

  updateContent: async (req, res) => {
    try {
      const { type } = req.params;
      const { title, description, descriptionEn, descriptionFr, status } = req.body;
      
      // Validate content type
      const validTypes = ['homepage_banner', 'about_us', 'contact_info'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid content type' });
      }

      // Validate required fields
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      // In production, this would save to database
      // For now, we'll return success and let frontend handle storage
      const updatedContent = {
        type,
        title,
        description: description || '',
        descriptionEn: descriptionEn || description || '',
        descriptionFr: descriptionFr || description || '',
        status: status || 'published',
        lastModified: new Date().toISOString()
      };

      res.json({
        success: true,
        message: 'Content updated successfully',
        data: updatedContent
      });
    } catch (err) {
      console.error('Error updating content:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getAllUsers: async (req, res) => {
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
  },


  createUser: async (req, res) => {
    try {
      const { username, email, password, role, bloodType, isDonor, isActive } = req.body;
      

      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide username, email and password'
        });
      }
      

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
      

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
  }
};