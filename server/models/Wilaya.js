const mongoose = require('mongoose');

const bloodCenterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  latitude: {
    type: Number, 
    required: true
  },
  longitude: {
    type: Number,
    required: true
  }
});

const wilayaSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  blood_centers: [bloodCenterSchema]
}, { timestamps: true });

// Create geospatial index for location-based queries
wilayaSchema.index({ latitude: 1, longitude: 1 });

const Wilaya = mongoose.model('Wilaya', wilayaSchema);

module.exports = Wilaya;
