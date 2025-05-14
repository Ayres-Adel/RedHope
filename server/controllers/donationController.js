const Donation = require('../models/Donation');
const User = require('../models/User');
const Hospital = require('../models/Hospital');

module.exports = {
  // Create new donation
  createDonation: async (req, res) => {
    try {
      const { recipientId, hospitalId, bloodType, scheduledDate, notes, emergencyLevel } = req.body;
      
      // Donor is the current user
      const donorId = req.user.userId;
      
      // Validate recipient and hospital exist
      const [recipient, hospital] = await Promise.all([
        User.findById(recipientId),
        Hospital.findById(hospitalId)
      ]);
      
      if (!recipient) {
        return res.status(404).json({ error: 'Recipient not found' });
      }
      
      if (!hospital) {
        return res.status(404).json({ error: 'Hospital not found' });
      }
      
      // Create the donation
      const donation = await Donation.create({
        donor: donorId,
        recipient: recipientId,
        hospital: hospitalId,
        bloodType,
        status: 'Scheduled',
        scheduledDate: new Date(scheduledDate),
        notes,
        emergencyLevel
      });
      
      // Create notifications for recipient
      await Notification.create({
        recipient: recipientId,
        type: 'DonationConfirmation',
        title: 'Donation Scheduled',
        message: `A donation has been scheduled for you on ${new Date(scheduledDate).toLocaleDateString()}`,
        relatedItem: {
          itemType: 'Donation',
          itemId: donation._id
        },
        priority: emergencyLevel === 'Critical' ? 'Urgent' : 'High'
      });
      
      res.status(201).json(donation);
    } catch (err) {
      console.error('Error creating donation:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },
  
  // Get all donations for a user (as donor or recipient)
  getUserDonations: async (req, res) => {
    try {
      const userId = req.user.userId;
      
      const donations = await Donation.find({
        $or: [
          { donor: userId },
          { recipient: userId }
        ]
      })
      .populate('donor', 'username email phoneNumber')
      .populate('recipient', 'username email phoneNumber')
      .populate('hospital', 'name structure telephone wilaya')
      .sort({ createdAt: -1 });
      
      res.json(donations);
    } catch (err) {
      console.error('Error fetching donations:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },
  
  // Update donation status
  updateDonationStatus: async (req, res) => {
    try {
      const { donationId } = req.params;
      const { status } = req.body;
      
      const validStatuses = ['Requested', 'Scheduled', 'Completed', 'Cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      const donation = await Donation.findById(donationId);
      
      if (!donation) {
        return res.status(404).json({ error: 'Donation not found' });
      }
      
      // Check authorization - only donor or recipient can update
      if (donation.donor.toString() !== req.user.userId && 
          donation.recipient.toString() !== req.user.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      // Update status and corresponding dates
      donation.status = status;
      
      if (status === 'Scheduled' && !donation.scheduledDate) {
        donation.scheduledDate = new Date();
      }
      
      if (status === 'Completed' && !donation.completedDate) {
        donation.completedDate = new Date();
      }
      
      await donation.save();
      
      // Create notification for other party
      const notificationRecipient = donation.donor.toString() === req.user.userId
        ? donation.recipient
        : donation.donor;
        
      await Notification.create({
        recipient: notificationRecipient,
        type: 'DonationMatch',
        title: `Donation ${status}`,
        message: `Your donation has been marked as ${status.toLowerCase()}`,
        relatedItem: {
          itemType: 'Donation',
          itemId: donation._id
        }
      });
      
      res.json(donation);
    } catch (err) {
      console.error('Error updating donation:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },
  
  // Get donation by ID
  getDonationById: async (req, res) => {
    try {
      const { donationId } = req.params;
      
      const donation = await Donation.findById(donationId)
        .populate('donor', 'username email phoneNumber')
        .populate('recipient', 'username email phoneNumber')
        .populate('hospital', 'name structure telephone wilaya');
      
      if (!donation) {
        return res.status(404).json({ error: 'Donation not found' });
      }
      
      // Check authorization - only donor or recipient can view details
      if (donation.donor._id.toString() !== req.user.userId && 
          donation.recipient._id.toString() !== req.user.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      res.json(donation);
    } catch (err) {
      console.error('Error fetching donation:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
};
