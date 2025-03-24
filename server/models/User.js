// models/User.js
const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
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
  gender: {
    type: String,
    required: [true, 'Please select your gender'],
    enum: ['Male', 'Female', 'Anonymous']
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
  }

});

// Password hashing and login method (same as before)

// fire a function before doc saved to db
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// static method to login user (same as before)
userSchema.statics.login = async function (email, password) {
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


userSchema.statics.checkExisting = async function ({ email, phoneNumber, password }) {
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

const User = mongoose.model('user', userSchema);
module.exports = User;
