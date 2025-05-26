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
      type: [Number], 
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


hospitalSchema.index({ location: '2dsphere' });


hospitalSchema.pre('save', async function(next) {
  if (this.wilaya && !this.wilayaCode) {
    try {

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
