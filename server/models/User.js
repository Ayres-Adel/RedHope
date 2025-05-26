const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please enter a username'],
    trim: true,
    unique: true
  },
  email: {
    type: String,
    required: [true, 'Please enter an email'],
    unique: true,
    lowercase: true,
    validate: [isEmail, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please enter a password'],
    minlength: [6, 'Minimum password length is 6 characters'],
    select: false
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please enter a phone number'],
    validate: {
      validator: function(v) {
        return /^(0|\+)?[0-9]{10,15}$/.test(v.replace(/\D/g, ''));
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  bloodType: {
    type: String,
    required: [true, 'Please select your blood type'],
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    default: 'Unknown'
  },
  location: {
    type: String
  },
  cityId: {
    type: String
  },
  isDonor: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email }).select('+password');
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

  const emailExists = await this.findOne({ email });
  if (emailExists) {
    throw Error('Email already exists');
  }


  const phoneExists = await this.findOne({ phoneNumber });
  if (phoneExists) {
    throw Error('Phone number already exists');
  }


  const existingUsers = await this.find({}); 
  for (let user of existingUsers) {
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (isPasswordMatch) {
      throw Error('Password already exists');
    }
  }


  return null;
};

UserSchema.methods.updateCityFromCoordinates = async function() {
  try {

    if (!this.location || !this.location.coordinates || 
        this.location.coordinates.length !== 2 ||
        (this.location.coordinates[0] === 0 && this.location.coordinates[1] === 0)) {
      return null;
    }
    

    const [longitude, latitude] = this.location.coordinates;
    

    const City = mongoose.model('City');
    const nearestCity = await City.findOne({
      'location': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: 50000 
        }
      }
    });
    
    if (nearestCity) {

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


UserSchema.statics.bulkUpdateCitiesFromCoordinates = async function(limit = 100) {
  try {

    const users = await this.find({
      city: null,
      'location.coordinates.0': { $ne: 0 },
      'location.coordinates.1': { $ne: 0 }
    }).limit(limit);
    
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

const User = mongoose.model('User', UserSchema);
module.exports = User;
