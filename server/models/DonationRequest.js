const mongoose = require('mongoose');

const donationRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return !this.guestRequester; } 
  },
  guestRequester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guest',
    required: function() { return !this.requester; } 
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false 
  },
  bloodType: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Any']
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital'

  },
  cityId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['Active', 'Fulfilled', 'Expired', 'Cancelled'],
    default: 'Active'
  },
  expiryDate: {
    type: Date,
    required: true
  }
}, { timestamps: true });


donationRequestSchema.index({ 
  'bloodType': 'text',
  'donor': 1,
  'cityId': 1 
});

const DonationRequest = mongoose.model('DonationRequest', donationRequestSchema);

module.exports = DonationRequest;
