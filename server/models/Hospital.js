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
  }
}, { timestamps: true });

// Create a geospatial index for location-based queries
hospitalSchema.index({ location: '2dsphere' });

const Hospital = mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital;
