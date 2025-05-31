const { Router } = require('express');
const router = Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User'); 


const MOCK_USERS = [
  { _id: '1', username: 'admin', email: 'admin@example.com', role: 'admin', bloodType: 'O+', status: 'Active', location: 'Algiers', isDonor: false },
  { _id: '2', username: 'johndoe', email: 'john@example.com', role: 'donor', bloodType: 'A+', status: 'Active', location: 'Oran', isDonor: true },
  { _id: '3', username: 'janesmith', email: 'jane@example.com', role: 'user', bloodType: 'B-', status: 'Active', location: 'Constantine', isDonor: false },
  { _id: '4', username: 'robertjohnson', email: 'robert@example.com', role: 'donor', bloodType: 'AB+', status: 'Active', location: 'Annaba', isDonor: true },
  { _id: '5', username: 'sarahwilliams', email: 'sarah@example.com', role: 'user', bloodType: 'O-', status: 'Active', location: 'Blida', isDonor: true }
];


router.use((req, res, next) => {
  next();
});


router.get('/all', async (req, res) => {
  try {
    const users = await User.find({});
    
    if (users && users.length > 0) {
      return res.status(200).json({
        success: true,
        users: users,
        source: 'database'
      });
    } else {
      return res.status(200).json({
        success: true,
        users: MOCK_USERS,
        source: 'mock'
      });
    }
  } catch (error) {

    return res.status(200).json({
      success: true,
      users: MOCK_USERS,
      source: 'mock (after db error)'
    });
  }
});


router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    
    try {

      const decoded = jwt.verify(token, secret);
      const userId = decoded.id;
      const userRole = decoded.role;
      

      let userData;
      
      if (userRole === 'admin' || userRole === 'superadmin') {

        const Admin = require('../models/Admin');
        userData = await Admin.findById(userId);
      }
      

      if (!userData) {
        userData = await User.findById(userId);
      }
      
      if (!userData) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      

      const formattedUser = {
        _id: userData._id,
        username: userData.username || userData.name || 'User',
        email: userData.email,
        role: userData.role || userRole || 'user',
        bloodType: userData.bloodType || 'Not specified',
        location: userData.location || userData.address || 'Not specified',
        phoneNumber: userData.phoneNumber || 'Not specified',
        dateOfBirth: userData.dateOfBirth,
        isActive: userData.isActive !== false,
        isDonor: userData.isDonor || false
      };
      
      return res.status(200).json({
        success: true,
        user: formattedUser
      });
      
    } catch (tokenError) {

      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          expired: true
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


router.get('/stats/dashboard', async (req, res) => {
  try {

    const users = await User.find({});
    

    const Donation = require('../models/Donation');
    const donations = await Donation.find({});
    

    const stats = {
      totalUsers: users.length,
      totalDonors: users.filter(user => user.isDonor).length,
      totalDonations: donations.length,
      pendingRequests: donations.filter(d => d.status === 'Pending').length,
      bloodSupply: calculateBloodSupply(users.filter(user => user.isDonor))
    };
    
    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats'
    });
  }
});


router.post('/create', async (req, res) => {
  try {
    const { 
      username, 
      email, 
      password, 
      role, 
      bloodType, 
      location, 
      isDonor,
      phoneNumber,  
      dateOfBirth  
    } = req.body;
    
    if (!username || !email || !password || !phoneNumber || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, password, phone number, and date of birth are required'
      });
    }

    // Validate age (16+ years)
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const exactAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
      ? age - 1 
      : age;

    if (exactAge < 16) {
      return res.status(400).json({
        success: false,
        message: 'You must be at least 16 years old to register'
      });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    const newUser = new User({
      username,
      email,
      password,
      role: role || 'user',
      bloodType: bloodType || 'Unknown',
      location: location || 'Unknown',
      isDonor: isDonor || false,
      isActive: true,
      phoneNumber: phoneNumber || '0000000000', 
      dateOfBirth: new Date(dateOfBirth)
    });
    
 
    await newUser.save();
    
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        bloodType: newUser.bloodType,
        location: newUser.location,
        isDonor: newUser.isDonor
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});


router.put('/change-password', async (req, res) => {
  try {

    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    

    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    
    try {
      const decoded = jwt.verify(token, secret);
      const userId = decoded.id;
      

      const { currentPassword, newPassword, confirmNewPassword } = req.body;
      
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        return res.status(400).json({
          success: false,
          message: 'Please provide current password, new password and confirmation'
        });
      }
      
      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password and confirmation do not match'
        });
      }
      

      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      

      const bcrypt = require('bcrypt');
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      

      user.password = newPassword; 
      await user.save();
      
      return res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
      
    } catch (tokenError) {

      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          expired: true
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    

    const { password, ...safeUpdateData } = updateData;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      safeUpdateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});


router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});


router.get('/test', async (req, res) => {
  try {

    const count = await User.countDocuments();
    
    res.status(200).json({
      success: true,
      message: 'User routes are working',
      databaseConnected: true,
      userCount: count,
      mockDataAvailable: MOCK_USERS.length > 0
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      message: 'User routes are working but database error occurred',
      databaseConnected: false,
      error: error.message,
      mockDataAvailable: MOCK_USERS.length > 0
    });
  }
});


router.get('/paginated', async (req, res) => {
  try {

    const {
      page = '1',
      limit = '10',
      search = '',
      sortBy = 'createdAt',
      sortOrder = '-1',
      role = '',
      bloodType = '',
      isDonor  
    } = req.query;


    const pageNum     = Math.max(1, parseInt(page, 10) || 1);
    const limitNum    = Math.max(1, parseInt(limit, 10) || 10);
    const skip        = (pageNum - 1) * limitNum;
    const sortOrderNum= parseInt(sortOrder, 10) === 1 ? 1 : -1;


    const filter = {};


    const trimmedSearch = search.trim();
    if (trimmedSearch) {

      const safeSearch = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(safeSearch, 'i');
      filter.$or = [
        { username:  re },
        { email:     re },
        { bloodType: re },
        { location:  re }
      ];
    }


    if (role) {
      filter.role = role;
    }


    if (bloodType) {
      filter.bloodType = bloodType;
    }


    let isDonorBool;
    if (isDonor === 'true')  isDonorBool = true;
    if (isDonor === 'false') isDonorBool = false;
    if (typeof isDonorBool === 'boolean') {
      filter.isDonor = isDonorBool;
    }


    const totalMatching = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalMatching / limitNum);


    const sortSpec = {
      [sortBy]: sortOrderNum,
      _id:      sortOrderNum 
    };

    const users = await User.find(filter)
      .select('-password')
      .sort(sortSpec)
      .skip(skip)
      .limit(limitNum)
      .lean(); 


    const response = {
      success: true,
      users,
      pagination: {
        currentPage:  pageNum,
        totalPages,
        totalItems:   totalMatching,
        itemsPerPage: limitNum
      }
    };


    if (process.env.NODE_ENV === 'development') {
      const totalInDb      = await User.countDocuments({});
      const totalDonors    = await User.countDocuments({ isDonor: true });
      const totalNonDonors = await User.countDocuments({ isDonor: false });
      
      response.debug = {
        totalInDb,
        totalDonors,
        totalNonDonors,
        totalMatching,
        appliedFilter: filter,
        sortSpec
      };
    }

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching paginated users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;