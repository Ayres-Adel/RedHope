// routes/userRoutes.js
const { Router } = require('express');
const router = Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User'); // Add User model import

// Mock data as fallback only
const MOCK_USERS = [
  { _id: '1', username: 'admin', email: 'admin@example.com', role: 'admin', bloodType: 'O+', status: 'Active', location: 'Algiers', isDonor: false },
  { _id: '2', username: 'johndoe', email: 'john@example.com', role: 'donor', bloodType: 'A+', status: 'Active', location: 'Oran', isDonor: true },
  { _id: '3', username: 'janesmith', email: 'jane@example.com', role: 'user', bloodType: 'B-', status: 'Active', location: 'Constantine', isDonor: false },
  { _id: '4', username: 'robertjohnson', email: 'robert@example.com', role: 'donor', bloodType: 'AB+', status: 'Active', location: 'Annaba', isDonor: true },
  { _id: '5', username: 'sarahwilliams', email: 'sarah@example.com', role: 'user', bloodType: 'O-', status: 'Active', location: 'Blida', isDonor: true }
];

// Add debugging middleware
router.use((req, res, next) => {
  next();
});

// Get all users from actual MongoDB Atlas database
router.get('/all', async (req, res) => {
  try {
    console.log('Attempting to fetch users from MongoDB Atlas...');
    
    // Try to get real users from the database
    const users = await User.find({});
    
    if (users && users.length > 0) {
      console.log(`Successfully retrieved ${users.length} users from database`);
      return res.status(200).json({
        success: true,
        users: users,
        source: 'database'
      });
    } else {
      console.log('No users found in database, falling back to mock data');
      return res.status(200).json({
        success: true,
        users: MOCK_USERS,
        source: 'mock'
      });
    }
  } catch (error) {
    console.error('Error fetching users from database:', error);
    // Fall back to mock data on error
    return res.status(200).json({
      success: true,
      users: MOCK_USERS,
      source: 'mock (after db error)'
    });
  }
});

// Optimize profile route for better performance and error handling
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
      // Decode token
      const decoded = jwt.verify(token, secret);
      const userId = decoded.id;
      const userRole = decoded.role;
      
      // Find user data based on role
      let userData;
      
      if (userRole === 'admin' || userRole === 'superadmin') {
        // Check admin collection first for admin users
        const Admin = require('../models/Admin');
        userData = await Admin.findById(userId);
      }
      
      // If not found or not admin, check regular User model
      if (!userData) {
        userData = await User.findById(userId);
      }
      
      if (!userData) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Format user data for consistent response
      const formattedUser = {
        _id: userData._id,
        username: userData.username || userData.name || 'User',
        email: userData.email,
        role: userData.role || userRole || 'user',
        bloodType: userData.bloodType || 'Not specified',
        location: userData.location || userData.address || 'Not specified',
        phoneNumber: userData.phoneNumber || 'Not specified', // Changed key from 'phone' to 'phoneNumber'
        isActive: userData.isActive !== false,
        isDonor: userData.isDonor || false
      };
      
      return res.status(200).json({
        success: true,
        user: formattedUser
      });
      
    } catch (tokenError) {
      // Handle token errors specifically
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
    console.error('Profile route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Add a stats API endpoint to reduce multiple calls
router.get('/stats/dashboard', async (req, res) => {
  try {
    // Get all users
    const users = await User.find({});
    
    // Get all donations
    const Donation = require('../models/Donation');
    const donations = await Donation.find({});
    
    // Calculate stats
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
    console.error('Stats API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats'
    });
  }
});

// Create user in actual database
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
      phoneNumber,  // Extract phoneNumber
      dateOfBirth   // Extract dateOfBirth
    } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email and password are required'
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
    
    // Create new user document with all required fields
    const newUser = new User({
      username,
      email,
      password, // This should be hashed in the User model pre-save hook
      role: role || 'user',
      bloodType: bloodType || 'Unknown',
      location: location || 'Unknown',
      isDonor: isDonor || false,
      isActive: true,
      phoneNumber: phoneNumber || '0000000000', // Add phoneNumber with default
      dateOfBirth: dateOfBirth || new Date('1990-01-01') // Add dateOfBirth with default
    });
    
    // Save to database
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
    console.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});

// Add a dedicated route for changing password
router.put('/change-password', async (req, res) => {
  try {
    // Get token from authorization header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Decode token to get userId
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    
    try {
      const decoded = jwt.verify(token, secret);
      const userId = decoded.id;
      
      // Validate password change request
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
      
      // Find user
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Verify current password
      const bcrypt = require('bcrypt');
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      
      // Update password
      user.password = newPassword; // The pre-save hook in the User model will hash this
      await user.save();
      
      return res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
      
    } catch (tokenError) {
      // Handle token errors
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
    console.error('Password change error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update user in database
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated directly
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
    console.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

// Delete user from database
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
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

// Test route with database connection status
router.get('/test', async (req, res) => {
  try {
    // Check database connection by counting users
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

// Get paginated users with search and filters
router.get('/paginated', async (req, res) => {
  try {
    // 1. Extract query params with defaults
    const {
      page = '1',
      limit = '10',
      search = '',
      sortBy = 'createdAt',
      sortOrder = '-1',
      role = '',
      bloodType = '',
      isDonor  // optional string "true" | "false"
    } = req.query;

    // 2. Normalize types
    const pageNum     = Math.max(1, parseInt(page, 10) || 1);
    const limitNum    = Math.max(1, parseInt(limit, 10) || 10);
    const skip        = (pageNum - 1) * limitNum;
    const sortOrderNum= parseInt(sortOrder, 10) === 1 ? 1 : -1;

    // 3. Build Mongo filter
    const filter = {};

    // 3a. Text search across multiple fields - with trimming
    const trimmedSearch = search.trim();
    if (trimmedSearch) {
      // Escape special regex characters to prevent injection
      const safeSearch = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(safeSearch, 'i');
      filter.$or = [
        { username:  re },
        { email:     re },
        { bloodType: re },
        { location:  re }
      ];
    }

    // 3b. Role filter
    if (role) {
      filter.role = role;
    }

    // 3c. Blood-type filter
    if (bloodType) {
      filter.bloodType = bloodType;
    }

    // 3d. Boolean isDonor filter (only if valid)
    let isDonorBool;
    if (isDonor === 'true')  isDonorBool = true;
    if (isDonor === 'false') isDonorBool = false;
    if (typeof isDonorBool === 'boolean') {
      filter.isDonor = isDonorBool;
    }

    // 4. Get counts for pagination
    const totalMatching = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalMatching / limitNum);

    // 5. Fetch with stable sorting to avoid duplicates
    const sortSpec = {
      [sortBy]: sortOrderNum,
      _id:      sortOrderNum // Secondary sort for stability
    };

    const users = await User.find(filter)
      .select('-password')
      .sort(sortSpec)
      .skip(skip)
      .limit(limitNum)
      .lean(); // Convert to plain JS objects for better performance

    // 6. Prepare response
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

    // Add debug info in development mode
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
    console.error('Error fetching paginated users:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching paginated users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;