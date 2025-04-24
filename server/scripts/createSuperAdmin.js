const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import the Admin model
const Admin = require('../models/Admin');

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if superadmin exists
    const adminExists = await Admin.findOne({ email: 'superadmin@redhope.org' });

    if (adminExists) {
      console.log('Superadmin already exists');
    } else {
      // Create superadmin
      const superAdmin = new Admin({
        username: 'superadmin',
        email: 'superadmin@redhope.org',
        firstName: 'Super',
        lastName: 'Admin',
        password: 'Admin@123', // Will be hashed by pre-save hook
        role: 'superadmin',
        permissions: {
          manageUsers: true,
          manageHospitals: true,
          manageDonations: true,
          viewReports: true,
          manageContent: true,
          manageAdmins: true
        },
        isActive: true
      });

      await superAdmin.save();
      console.log('Superadmin created successfully');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createSuperAdmin();
