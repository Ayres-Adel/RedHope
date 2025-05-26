const mongoose = require('mongoose');

const connectDB = async () => {
  try {

    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/redhope';
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000 
    });
    
    return true;
  } catch (err) {
    
    if (err.name === 'MongoServerSelectionError') {
    }
    
    return false;
  }
};

module.exports = connectDB;
