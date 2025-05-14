const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please enter a username'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please enter an email'],
    unique: true,
    lowercase: true,
    trim: true
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
    viewReports: { type: Boolean, default: true },
    manageContent: { type: Boolean, default: false },
    manageAdmins: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  profileImage: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Admin login method
adminSchema.statics.login = async function(email, password) {
  const admin = await this.findOne({ email });
  
  if (!admin) {
    throw Error('Admin not found');
  }
  
  if (!admin.isActive) {
    throw Error('Account is disabled');
  }
  
  const auth = await bcrypt.compare(password, admin.password);
  if (!auth) {
    throw Error('Incorrect password');
  }
  
  return admin;
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
