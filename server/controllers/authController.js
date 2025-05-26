const User = require('../models/User');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const createToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }
    
    let admin = null;
    let user = null;
    let isAdmin = false;
    
    try {
      admin = await Admin.findOne({ email }).select('+password');
      
      if (admin) {
        isAdmin = true;
        user = admin;
      } else {
        user = await User.findOne({ email }).select('+password');
      }
    } catch (dbError) {
      return res.status(500).json({
        success: false,
        message: 'Database error occurred',
        error: dbError.message
      });
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      return res.status(500).json({
        success: false,
        message: 'Authentication error',
        error: bcryptError.message
      });
    }
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    const role = isAdmin ? (admin.role || 'admin') : (user.role || 'user');
    
    const token = createToken(user._id, role);
    
    const refreshToken = jwt.sign(
      { id: user._id, role },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      { expiresIn: '7d' }
    );
    
    if (isAdmin) {
      try {
        await Admin.findByIdAndUpdate(admin._id, { lastLogin: new Date() });
      } catch (updateError) {
      }
    }
    
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
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login',
      error: error.message
    });
  }
};

exports.register = async (req, res) => {
  try {
    const { 
      username, 
      email, 
      password, 
      bloodType, 
      isDonor,
      dateOfBirth,
      location,
      phoneNumber,
      cityId
    } = req.body;
    
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
        message: 'Email is already registered'
      });
    }
    
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
      cityId: cityId || null,
      lastCityUpdate: cityId ? new Date() : null
    });
    
    const token = createToken(user._id, 'user');
    
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
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

exports.logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

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
      res.status(500).send('Server error');
  }
};

const haversineDistance = (coords1, coords2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  
  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;

  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

module.exports.nearby_get = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const bloodType = req.query.bloodType || null;
    
    let userLocation;
    
    const { lat, lng } = req.query;
    
    if (lat && lng) {
      userLocation = [parseFloat(lat), parseFloat(lng)];
      
      if (userLocation.length !== 2 || isNaN(userLocation[0]) || isNaN(userLocation[1])) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid location format in query parameters.' 
        });
      }
    } else {
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

      userLocation = user.location.split(',').map(Number);
      
      if (userLocation.length !== 2 || isNaN(userLocation[0]) || isNaN(userLocation[1])) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid stored location format. Please update your location in your profile.' 
        });
      }
    }

    const donorQuery = { isDonor: true };
    
    if (bloodType) {
      donorQuery.bloodType = bloodType;
    }
    
    if (req.user && req.user.userId) {
      donorQuery._id = { $ne: req.user.userId };
    }
    
    const allDonors = await User.find(donorQuery);
    
    const donorsWithDistance = allDonors
      .filter(donor => donor.location)
      .map((donor) => {
        try {
          const donorLocation = donor.location.split(',').map(Number);
          const distance = haversineDistance(userLocation, donorLocation);
          return { ...donor._doc, distance };
        } catch (error) {
          return null;
        }
      })
      .filter(donor => donor !== null);

    donorsWithDistance.sort((a, b) => a.distance - b.distance);

    const totalDonors = donorsWithDistance.length;
    
    const skip = (page - 1) * limit;
    const paginatedDonors = donorsWithDistance.slice(skip, skip + limit);
    
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
    res.status(500).json({
      success: false,
      message: 'Server error when finding nearby donors',
      error: err.message
    });
  }
};

module.exports.public_nearby_get = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const bloodType = req.query.bloodType || null;
    
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

    const donorQuery = { isDonor: true };
    
    if (bloodType) {
      donorQuery.bloodType = bloodType;
    }
    
    const allDonors = await User.find(donorQuery);
    
    const donorsWithDistance = allDonors
      .filter(donor => donor.location)
      .map((donor) => {
        try {
          const donorLocation = donor.location.split(',').map(Number);
          const distance = haversineDistance(userLocation, donorLocation);
          return { ...donor._doc, distance };
        } catch (error) {
          return null;
        }
      })
      .filter(donor => donor !== null);

    donorsWithDistance.sort((a, b) => a.distance - b.distance);

    const totalDonors = donorsWithDistance.length;
    
    const skip = (page - 1) * limit;
    const paginatedDonors = donorsWithDistance.slice(skip, skip + limit);
    
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
    res.status(500).json({
      success: false,
      message: 'Server error when finding nearby donors',
      error: err.message
    });
  }
};

exports.findNearbyDonors = async (req, res) => {
  try {
    const { lat, lng, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false, 
        message: 'Latitude and longitude are required'
      });
    }

    const donors = await User.find({ isDonor: true })
      .skip(skip)
      .limit(limitNum);
    
    const totalDonors = await User.countDocuments({ isDonor: true });

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
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};