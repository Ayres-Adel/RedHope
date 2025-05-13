// models/User.js
const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please enter a username'],
    trim: true,
    unique: false,
    minlength: [3, 'Minimum username length is 3 characters']
  },
  email: {
    type: String,
    required: [true, 'Please enter an email'],
    unique: true,
    lowercase: true,
    validate: [isEmail, 'Please enter a valid email']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Please enter your date of birth']
  },
  location: {
    type: String,
    required: [true, 'Please enter your location']
  },
  bloodType: {
    type: String,
    required: [true, 'Please select your blood type'],
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
  },
  password: {
    type: String,
    required: [true, 'Please enter a password'],
    minlength: [6, 'Minimum password length is 6 characters'],
  },
  isDonor: {
    type: Boolean,
    required: [true, 'Please specify if you want to be a donor']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please enter a phone number'],
    validate: {
      validator: function(v) {
        // Updated regex to allow phone numbers starting with '0' or '+', followed by digits
        return /^(0|\+)[1-9]\d{8,14}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  // Keep the cityId field for backward compatibility if needed
  cityId: {
    type: String,
    default: null
  },
  // Add lastCityUpdate timestamp to track when city was last determined
  lastCityUpdate: {
    type: Date,
    default: null
  }
});

// Password hashing and login method (same as before)

// fire a function before doc saved to db
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// static method to login user (same as before)
UserSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      return user;
    }
    throw Error('incorrect password');
  }
  throw Error('incorrect email');
};


UserSchema.statics.checkExisting = async function ({ email, phoneNumber, password }) {
  // Check if email exists
  const emailExists = await this.findOne({ email });
  if (emailExists) {
    throw Error('Email already exists');
  }

  // Check if phone number exists
  const phoneExists = await this.findOne({ phoneNumber });
  if (phoneExists) {
    throw Error('Phone number already exists');
  }

  // Check if password already exists (hashed comparison)
  const existingUsers = await this.find({}); // Get all users (you can filter to specific conditions if needed)
  for (let user of existingUsers) {
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (isPasswordMatch) {
      throw Error('Password already exists');
    }
  }

  // No errors, return null or true
  return null;
};

UserSchema.methods.updateCityFromCoordinates = async function() {
  try {
    // Skip if no valid coordinates
    if (!this.location || !this.location.coordinates || 
        this.location.coordinates.length !== 2 ||
        (this.location.coordinates[0] === 0 && this.location.coordinates[1] === 0)) {
      return null;
    }
    
    // Get longitude and latitude
    const [longitude, latitude] = this.location.coordinates;
    
    // Find the nearest city using geospatial query
    const City = mongoose.model('City');
    const nearestCity = await City.findOne({
      'location': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: 50000 // 50km radius
        }
      }
    });
    
    if (nearestCity) {
      // Update city reference
      this.city = nearestCity._id;
      this.cityId = nearestCity.code.toString();
      this.lastCityUpdate = new Date();
      await this.save();
      
      return nearestCity;
    }
    
    return null;
  } catch (error) {
    console.error('Error determining city from coordinates:', error);
    return null;
  }
};

// Add a static method to bulk update cities for users with coordinates but no city
UserSchema.statics.bulkUpdateCitiesFromCoordinates = async function(limit = 100) {
  try {
    // Find users with coordinates but no city
    const users = await this.find({
      city: null,
      'location.coordinates.0': { $ne: 0 },
      'location.coordinates.1': { $ne: 0 }
    }).limit(limit);
    
    console.log(`Found ${users.length} users with coordinates but no city`);
    
    let updatedCount = 0;
    for (const user of users) {
      const city = await user.updateCityFromCoordinates();
      if (city) {
        updatedCount++;
      }
    }
    
    return { processed: users.length, updated: updatedCount };
  } catch (error) {
    console.error('Error in bulk city update:', error);
    return { processed: 0, updated: 0, error: error.message };
  }
};

const User = mongoose.model('user', UserSchema);
module.exports = User;
