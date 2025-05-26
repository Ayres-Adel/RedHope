const mongoose = require('mongoose');

const GuestSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: [true, 'Please enter a phone number'],
    unique: true,
    validate: {
      validator: function(v) {

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


GuestSchema.index({ location: '2dsphere' });


GuestSchema.methods.updateCityFromCoordinates = async function() {
  try {

    if (!this.location || !this.location.coordinates || 
        this.location.coordinates.length !== 2 ||
        (this.location.coordinates[0] === 0 && this.location.coordinates[1] === 0)) {
      return null;
    }
    

    const [longitude, latitude] = this.location.coordinates;
    

    const Wilaya = mongoose.model('Wilaya');
    const nearestWilaya = await Wilaya.findOne({
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
    
    if (nearestWilaya) {

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
