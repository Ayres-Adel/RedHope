const mongoose = require('mongoose');

const donationRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patient: {
    name: {
      type: String,
      required: true
    },
    age: {
      type: Number
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Anonymous']
    }
  },
  bloodType: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Any']
  },
  unitsNeeded: {
    type: Number,
    required: true,
    min: 1
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital'
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
    },
    address: {
      type: String
    }
  },
  urgency: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Active', 'Fulfilled', 'Expired', 'Cancelled'],
    default: 'Active'
  },
  expiryDate: {
    type: Date,
    required: true
  },
  notes: {
    type: String
  },
  contactInfo: {
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String
    },
    preferredContactMethod: {
      type: String,
      enum: ['Phone', 'Email', 'Either'],
      default: 'Phone'
    }
  },
  donorResponses: [{
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    responseDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Interested', 'Confirmed', 'Cancelled', 'Completed'],
      default: 'Interested'
    }
  }]
}, { timestamps: true });

// Create geospatial index
donationRequestSchema.index({ location: '2dsphere' });

// Create text index for searching
donationRequestSchema.index({ 
  'patient.name': 'text',
  'notes': 'text',
  'contactInfo.phone': 'text'
});

const DonationRequest = mongoose.model('DonationRequest', donationRequestSchema);

module.exports = DonationRequest;
