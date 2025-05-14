const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { requireAuth, checkUser } = require('./middleware/authMiddleware');

// Import all route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const statsRoutes = require('./routes/statsRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const wilayaRoutes = require('./routes/wilayaRoutes');
const donationRoutes = require('./routes/donationRoutes');
const donationRequestRoutes = require('./routes/donationRequestRoutes');
const adminRoutes = require('./routes/adminRoutes');
// Add map routes
const mapRoutes = require('./routes/mapRoutes');

const app = express();

// Load environment variables early to ensure they're available
dotenv.config();

// Debug database connection string (masked for security)
const dbUriParts = (process.env.MONGO_URI || '').split(':');

// Apply middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Register routes - ensure proper prefixing
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes); 
app.use('/api/hospital', hospitalRoutes);
app.use('/api/wilaya', wilayaRoutes);
app.use('/api/donation', donationRoutes);
app.use('/api/donation-request', donationRequestRoutes);
// Use the admin routes
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);
// Add map routes
app.use('/api/map', mapRoutes);

// Simple test route that doesn't require database
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Improved error handling middleware
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: {
      auth: ['/api/auth/login', '/api/auth/register', '/api/auth/logout'],
      user: ['/api/user/profile', '/api/user/all', '/api/user/change-password'],
      admin: ['/api/admin/profile', '/api/admin/verify'],
      stats: ['/api/stats/dashboard', '/api/stats/blood-supply']
    }
  });
});

// Comprehensive error handler
app.use((err, req, res, next) => {
  // Log error for debugging
  console.error('Server error:', err);
  
  // Handle different types of errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => ({
        path: e.path,
        msg: e.message
      }))
    });
  }
  
  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate key error',
      field: Object.keys(err.keyPattern)[0]
    });
  }
  
  // Generic error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    // Only show stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Ensure Admin model is loaded
try {
  const adminSchema = new mongoose.Schema({
    username: {
      type: String,
      required: [true, 'Please enter a username'],
      unique: true
    },
    email: {
      type: String,
      required: [true, 'Please enter an email'],
      unique: true,
      lowercase: true
    },
    // firstName and lastName fields removed
    password: {
      type: String,
      required: [true, 'Please enter a password'],
      minlength: [6, 'Minimum password length is 6 characters']
    },
    role: {
      type: String,
      enum: ['admin', 'superadmin'],
      default: 'admin'
    },
    permissions: {
      manageUsers: { type: Boolean, default: true },
      manageHospitals: { type: Boolean, default: true },
      manageContent: { type: Boolean, default: false },
      viewReports: { type: Boolean, default: true },
      manageAdmins: { type: Boolean, default: false }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    }
  }, { timestamps: true });
  
  // Add pre-save hook for password hashing
  adminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });
  
  // Only create model if it doesn't already exist
  if (!mongoose.models.Admin) {
    mongoose.model('Admin', adminSchema);
    console.log('Admin model registered');
  }
} catch (err) {
  console.error('Error registering Admin model:', err);
}

const connectDB = require('./config/db');

// Initialize connection and start server
connectDB().then(connected => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    if (connected) {
      console.log(`✅ Server running on port ${PORT}`);
    } else {
      console.log(`⚠️ Server running on port ${PORT} (NO DATABASE CONNECTION)`);
    }
  });
});

module.exports = app; // Export for testing
