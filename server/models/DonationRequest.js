const mongoose = require('mongoose');

const donationRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return !this.guestRequester; } // Only required if no guest requester
  },
  guestRequester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guest',
    required: function() { return !this.requester; } // Only required if no registered requester
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Changed from required:true to false to allow guest requests without an initial donor
  },
  bloodType: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Any']
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital'
    // Not required, optional
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

// Create text index for searching
donationRequestSchema.index({ 
  'bloodType': 'text',
  'donor': 1
});

const DonationRequest = mongoose.model('DonationRequest', donationRequestSchema);

module.exports = DonationRequest;
