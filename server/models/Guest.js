const mongoose = require('mongoose');

const GuestSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: [true, 'Please enter a phone number'],
    unique: true,
    validate: {
      validator: function(v) {
        // Basic phone number validation - can be adjusted for your requirements
        return /^\d{10,15}$/.test(v.replace(/\D/g, ''));
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for geospatial queries
GuestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Guest', GuestSchema);
