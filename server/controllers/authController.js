// controllers/authController.js
const User = require('../models/User');
const Admin = require('../models/Admin'); // Ensure Admin model is imported
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Helper function to create JWT token
const createToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

// Login controller - handles both User and Admin authentication
exports.login = async (req, res) => {
  console.log('Login attempt with body:', req.body);
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('Missing email or password in request');
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }
    
    // First, try to find in Admin collection
    let admin = null;
    let user = null;
    let isAdmin = false;
    
    try {
      console.log('Checking admin collection for:', email);
      admin = await Admin.findOne({ email }).select('+password');
      
      if (admin) {
        console.log('Found in admin collection:', admin._id);
        isAdmin = true;
        user = admin; // Use admin as the user object for login
      } else {
        // If not found in admin, check regular users
        console.log('Not found in admin collection, checking users collection');
        user = await User.findOne({ email }).select('+password');
        
        if (user) {
          console.log('Found in users collection:', user._id);
        } else {
          console.log('User not found in either collection');
        }
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database error occurred',
        error: dbError.message
      });
    }
    
    // If no user found in either collection
    if (!user) {
      console.log(`No user or admin found with email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check password
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('Password validation result:', isPasswordValid);
    } catch (bcryptError) {
      console.error('Bcrypt error:', bcryptError);
      return res.status(500).json({
        success: false,
        message: 'Authentication error',
        error: bcryptError.message
      });
    }
    
    if (!isPasswordValid) {
      console.log('Invalid password provided');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Determine role for token
    const role = isAdmin ? (admin.role || 'admin') : (user.role || 'user');
    
    // Create token
    const token = createToken(user._id, role);
    
    // Create refresh token
    const refreshToken = jwt.sign(
      { id: user._id, role },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      { expiresIn: '7d' }
    );
    
    console.log('Login successful as:', isAdmin ? 'admin' : 'user');
    
    // If admin, update last login time
    if (isAdmin) {
      try {
        await Admin.findByIdAndUpdate(admin._id, { lastLogin: new Date() });
      } catch (updateError) {
        console.error('Error updating last login time:', updateError);
      }
    }
    
    // Send response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user._id,
        username: user.username || user.firstName + ' ' + user.lastName,
        email: user.email,
        role,
        isAdmin
      }
    });
    
  } catch (error) {
    console.error('Unexpected error in login:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login',
      error: error.message
    });
  }
};

// Register controller
exports.register = async (req, res) => {
  try {
    console.log('Registration attempt with data:', req.body);
    const { 
      username, 
      email, 
      password, 
      firstName, 
      lastName, 
      bloodType, 
      isDonor,
      dateOfBirth,
      location,
      gender,
      phoneNumber 
    } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email and password'
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered'
      });
    }
    
    // Create new user with all required fields
    const user = await User.create({
      username,
      email,
      password,
      firstName: firstName || username,
      lastName: lastName || '',
      bloodType: bloodType || 'Unknown',
      role: 'user',
      isDonor: isDonor || false,
      // Include the required fields
      dateOfBirth,
      location,
      gender,
      phoneNumber
    });
    
    // Generate token
    const token = createToken(user._id, 'user');
    
    // Send response
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Logout controller
exports.logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// Refresh token controller
exports.refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const newToken = createToken(user._id, user.role);
    
    res.status(200).json({
      success: true,
      token: newToken
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};