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
        username: user.username,
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
      bloodType, 
      isDonor,
      dateOfBirth,
      location,
      phoneNumber,
      cityId  // Add support for cityId field from client
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
      bloodType: bloodType || 'Unknown',
      role: 'user',
      isDonor: isDonor || false,
      dateOfBirth,
      location,
      phoneNumber,
      cityId: cityId || null, // Store the cityId in the user document
      lastCityUpdate: cityId ? new Date() : null // Track when cityId was set
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

module.exports.dashboard_get =  async (req, res) => {
  try {
      const user = await User.findById(req.user.userId).select('-password');
      res.json({
        msg: `${user.email}`,
      });
  } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
  }
};

const haversineDistance = (coords1, coords2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  
  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

module.exports.nearby_get = async (req, res) => {
  try {
    console.log('nearby_get called with user ID:', req.user?.userId || 'undefined');
    
    // Extract pagination and filter parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const bloodType = req.query.bloodType || null; // Add bloodType filter parameter
    
    let userLocation;
    
    // Check if location parameters are provided in the request
    const { lat, lng } = req.query;
    
    if (lat && lng) {
      // Use provided location parameters
      userLocation = [parseFloat(lat), parseFloat(lng)];
      
      if (userLocation.length !== 2 || isNaN(userLocation[0]) || isNaN(userLocation[1])) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid location format in query parameters.' 
        });
      }
      
      console.log('Using query location parameters:', userLocation);
    } else {
      // Fall back to user's stored location
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated or invalid token' 
        });
      }
      
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }
      
      if (!user.location) {
        return res.status(400).json({ 
          success: false,
          message: 'User location not found. Please update your profile with your location or provide location parameters.' 
        });
      }

      console.log('Using stored user location:', user.location);
      userLocation = user.location.split(',').map(Number); // Convert to [latitude, longitude]
      
      if (userLocation.length !== 2 || isNaN(userLocation[0]) || isNaN(userLocation[1])) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid stored location format. Please update your location in your profile.' 
        });
      }
    }

    // Fetch ALL donors matching the query (without pagination yet)
    const donorQuery = { isDonor: true };
    
    // Add blood type filter if provided
    if (bloodType) {
      donorQuery.bloodType = bloodType;
    }
    
    if (req.user && req.user.userId) {
      donorQuery._id = { $ne: req.user.userId }; // Exclude the current user if authenticated
    }
    
    // Get all donors matching filters - we'll paginate after sorting by distance
    const allDonors = await User.find(donorQuery);
    
    // Calculate distances for each donor
    const donorsWithDistance = allDonors
      .filter(donor => donor.location) // Only include donors with location
      .map((donor) => {
        try {
          const donorLocation = donor.location.split(',').map(Number);
          const distance = haversineDistance(userLocation, donorLocation);
          return { ...donor._doc, distance }; // Spread donor fields and add distance
        } catch (error) {
          console.error(`Error processing donor ${donor._id}:`, error);
          return null;
        }
      })
      .filter(donor => donor !== null);

    // Sort by distance (closest first)
    donorsWithDistance.sort((a, b) => a.distance - b.distance);

    // Get total count for pagination metadata
    const totalDonors = donorsWithDistance.length;
    
    // Apply pagination AFTER sorting by distance
    const skip = (page - 1) * limit;
    const paginatedDonors = donorsWithDistance.slice(skip, skip + limit);

    console.log(`Found ${donorsWithDistance.length} nearby donors, returning page ${page} (${paginatedDonors.length} items)`);
    
    // Return with pagination metadata
    res.json({
      data: paginatedDonors,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalDonors / limit) || 1,
        totalItems: totalDonors,
        itemsPerPage: limit
      }
    });
  } catch (err) {
    console.error('Error in nearby_get:', err);
    res.status(500).json({
      success: false,
      message: 'Server error when finding nearby donors',
      error: err.message
    });
  }
};

module.exports.public_nearby_get = async (req, res) => {
  try {
    console.log('public_nearby_get called');
    
    // Extract pagination and filter parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const bloodType = req.query.bloodType || null; // Add bloodType filter parameter
    
    // Get location from query parameters
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        success: false,
        message: 'Location parameters (lat, lng) are required' 
      });
    }
    
    const userLocation = [parseFloat(lat), parseFloat(lng)];
    
    if (isNaN(userLocation[0]) || isNaN(userLocation[1])) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid location format. Please provide valid latitude and longitude.' 
      });
    }

    // Create query object with filters
    const donorQuery = { isDonor: true };
    
    // Add blood type filter if provided
    if (bloodType) {
      donorQuery.bloodType = bloodType;
    }
    
    // Get all donors matching filters - we'll paginate after sorting by distance
    const allDonors = await User.find(donorQuery);
    
    // Calculate distances for each donor
    const donorsWithDistance = allDonors
      .filter(donor => donor.location)
      .map((donor) => {
        try {
          const donorLocation = donor.location.split(',').map(Number);
          const distance = haversineDistance(userLocation, donorLocation);
          return { ...donor._doc, distance };
        } catch (error) {
          console.error(`Error processing donor ${donor._id}:`, error);
          return null;
        }
      })
      .filter(donor => donor !== null);

    // Sort by distance (closest first)
    donorsWithDistance.sort((a, b) => a.distance - b.distance);

    // Get total count for pagination metadata
    const totalDonors = donorsWithDistance.length;
    
    // Apply pagination AFTER sorting by distance
    const skip = (page - 1) * limit;
    const paginatedDonors = donorsWithDistance.slice(skip, skip + limit);

    console.log(`Found ${donorsWithDistance.length} nearby donors for public request, returning page ${page} (${paginatedDonors.length} items)`);
    
    // Return with pagination metadata
    res.json({
      data: paginatedDonors,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalDonors / limit) || 1,
        totalItems: totalDonors,
        itemsPerPage: limit
      }
    });
  } catch (err) {
    console.error('Error in public_nearby_get:', err);
    res.status(500).json({
      success: false,
      message: 'Server error when finding nearby donors',
      error: err.message
    });
  }
};

// This is a conceptual example - modify your actual endpoint
exports.findNearbyDonors = async (req, res) => {
  try {
    const { lat, lng, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Validate coordinates
    if (!lat || !lng) {
      return res.status(400).json({
        success: false, 
        message: 'Latitude and longitude are required'
      });
    }

    // Find donors with pagination
    const donors = await User.find({ isDonor: true })
      .skip(skip)
      .limit(limitNum);
    
    // Calculate total for pagination
    const totalDonors = await User.countDocuments({ isDonor: true });
    
    // Calculate distances and add to response
    // ...your existing distance calculation code...

    return res.status(200).json({
      success: true,
      data: donors,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalDonors / limitNum),
        totalItems: totalDonors,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('Error in findNearbyDonors:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};