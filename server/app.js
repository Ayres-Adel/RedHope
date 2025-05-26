const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { requireAuth, checkUser } = require('./middleware/authMiddleware');


const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const statsRoutes = require('./routes/statsRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const wilayaRoutes = require('./routes/wilayaRoutes');
const donationRequestRoutes = require('./routes/donationRequestRoutes');
const adminRoutes = require('./routes/adminRoutes');

const mapRoutes = require('./routes/mapRoutes');

const guestRoutes = require('./routes/guestRoutes');

const app = express();


dotenv.config();


const dbUriParts = (process.env.MONGO_URI || '').split(':');


app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {

  next();
});


app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes); 
app.use('/api/hospital', hospitalRoutes);
app.use('/api/wilaya', wilayaRoutes);
app.use('/api/donation-request', donationRequestRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);

app.use('/api/map', mapRoutes);

app.use('/api/guest', guestRoutes);


app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});


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


app.use((err, req, res, next) => {

  console.error('Server error:', err);
  

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
  

  if (err.name === 'MongooseError' && err.message.includes('timed out')) {
    return res.status(503).json({
      success: false,
      message: 'Database operation timed out. Please try again later.',
      error: 'database_timeout',
      details: err.message
    });
  }
  

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',

    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});


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
  

  adminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });
  

  if (!mongoose.models.Admin) {
    mongoose.model('Admin', adminSchema);
    console.log('Admin model registered');
  }
} catch (err) {
  console.error('Error registering Admin model:', err);
}

const connectDB = require('./config/db');


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

module.exports = app; 
