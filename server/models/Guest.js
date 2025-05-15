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
  cityId: {
    type: String,
    default: null
  },
  lastCityUpdate: {
    type: Date,
    default: null
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for geospatial queries
GuestSchema.index({ location: '2dsphere' });

// Add method to update city from coordinates
GuestSchema.methods.updateCityFromCoordinates = async function() {
  try {
    // Skip if no valid coordinates
    if (!this.location || !this.location.coordinates || 
        this.location.coordinates.length !== 2 ||
        (this.location.coordinates[0] === 0 && this.location.coordinates[1] === 0)) {
      return null;
    }
    
    // Get longitude and latitude
    const [longitude, latitude] = this.location.coordinates;
    
    // Find the nearest wilaya using geospatial query
    const Wilaya = mongoose.model('Wilaya');
    const nearestWilaya = await Wilaya.findOne({
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
    
    if (nearestWilaya) {
      // Update cityId with wilaya code
      this.cityId = nearestWilaya.code.toString();
      this.lastCityUpdate = new Date();
      await this.save();
      
      return nearestWilaya;
    }
    
    return null;
  } catch (error) {
    console.error('Error determining city from coordinates:', error);
    return null;
  }
};

module.exports = mongoose.model('Guest', GuestSchema);
