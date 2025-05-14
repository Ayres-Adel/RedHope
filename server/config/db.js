const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Default to local MongoDB if MONGO_URI is not provided
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/redhope';
    
    // Remove deprecated options
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000 // Timeout after 5s
    });
    
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    
    if (err.name === 'MongoServerSelectionError') {
      console.error('Could not connect to MongoDB server. Please check:');
      console.error('1. MongoDB is running');
      console.error('2. Connection string is correct');
      console.error('3. Network allows connection to MongoDB port');
    }
    
    return false;
  }
};

module.exports = connectDB;
