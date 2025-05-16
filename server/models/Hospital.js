const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  structure: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  telephone: {
    type: String,
    trim: true
  },
  fax: {
    type: String,
    trim: true
  },
  wilaya: {
    type: String,
    required: true,
    trim: true
  },
  wilayaCode: {
    type: String,
    trim: true,
    index: true
  }
}, { timestamps: true });

// Create a geospatial index for location-based queries
hospitalSchema.index({ location: '2dsphere' });

// Add a pre-save hook to set wilayaCode if only wilaya name is provided
hospitalSchema.pre('save', async function(next) {
  if (this.wilaya && !this.wilayaCode) {
    try {
      // Try to find corresponding wilaya code
      const Wilaya = mongoose.model('Wilaya');
      const wilaya = await Wilaya.findOne({ 
        name: { $regex: new RegExp(this.wilaya, 'i') }
      });
      
      if (wilaya) {
        this.wilayaCode = wilaya.code;
      }
    } catch (err) {
      console.error('Error setting wilaya code:', err);
    }
  }
  next();
});

const Hospital = mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital;
