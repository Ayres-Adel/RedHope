const DonationRequest = require('../models/DonationRequest');
const User = require('../models/User');
const Guest = require('../models/Guest');

module.exports = {
  // Create a new donation request
  createDonationRequest: async (req, res) => {
    try {
      const { bloodType, hospitalId, expiryDate, donorId } = req.body;
      
      // Create request data
      const requestData = {
        requester: req.user.userId,
        bloodType,
        status: 'Active',
        expiryDate: new Date(expiryDate)
      };
      
      // Add hospital if provided
      if (hospitalId) {
        requestData.hospital = hospitalId;
      }
      
      // Add donor if provided
      if (donorId) {
        // Verify the donor exists
        const donor = await User.findById(donorId);
        if (!donor) {
          return res.status(404).json({ 
            success: false,
            error: 'Selected donor not found' 
          });
        }
        
        requestData.donor = donorId;
      }
      
      const donationRequest = await DonationRequest.create(requestData);
      
      // Determine which donors to notify
      let potentialDonors = [];
      
      if (donorId) {
        // If a specific donor was selected, only notify that donor
        potentialDonors = [{ _id: donorId }];
      } else {
        // Otherwise find potential donors with matching blood type
        const compatibleBloodTypes = getCompatibleBloodTypes(bloodType);
        
        potentialDonors = await User.find({
          isDonor: true,
          bloodType: { $in: compatibleBloodTypes }
        }).limit(20);
      }
      
      // Create notifications for potential donors
      if (global.Notification && potentialDonors.length > 0) {
        const notificationPromises = potentialDonors.map(donor => 
          global.Notification.create({
            recipient: donor._id,
            type: 'DonationRequest',
            title: `Blood Donation Need: ${bloodType}`,
            message: `Someone needs ${bloodType} blood donation. Can you help?`,
            relatedItem: {
              itemType: 'DonationRequest',
              itemId: donationRequest._id
            },
            priority: donorId ? 'Urgent' : 'High' // Higher priority for directed requests
          })
        );
        
        await Promise.all(notificationPromises);
      }
      
      res.status(201).json({
        success: true,
        donationRequest
      });
    } catch (err) {
      console.error('Error creating donation request:', err);
      res.status(500).json({ 
        success: false,
        error: 'Server error',
        message: err.message
      });
    }
  },
  
  // Create donation request for guest users
  createGuestDonationRequest: async (req, res) => {
    try {
      const {
        guestId,
        phoneNumber,
        bloodType,
        hospitalId,
        expiryDate,
        donorId  // Allow specifying a donor ID directly
      } = req.body;
      
      // Validate either guestId or phoneNumber is provided
      if (!guestId && !phoneNumber) {
        return res.status(400).json({ 
          success: false, 
          error: 'Either guest ID or phone number is required' 
        });
      }
      
      // Validate required fields
      if (!bloodType) {
        return res.status(400).json({
          success: false,
          error: 'Blood type is required'
        });
      }
      
      // Find or create guest
      let guest;
      if (guestId) {
        guest = await Guest.findById(guestId);
        if (!guest) {
          return res.status(404).json({ 
            success: false, 
            error: 'Guest not found' 
          });
        }
      } else {
        // Try to find guest by phone number
        guest = await Guest.findOne({ phoneNumber });
        
        // If guest doesn't exist, create a new guest
        if (!guest) {
          guest = new Guest({
            phoneNumber,
            location: req.body.location || { 
              type: 'Point', 
              coordinates: [0, 0] // Default coordinates if none provided
            }
          });
          await guest.save();
        }
        
        // Update last active time
        guest.lastActive = Date.now();
        await guest.save();
      }
      
      // If donor ID is not provided, try to find compatible donors
      let donorToAssign = donorId;
      if (!donorToAssign) {
        const compatibleDonors = await User.find({
          isDonor: true,
          bloodType: bloodType
        }).limit(1);
        
        if (compatibleDonors.length > 0) {
          donorToAssign = compatibleDonors[0]._id;
        } else {
          // If no compatible donor found, mark as blank initially
          donorToAssign = null;
        }
      }
      
      // Prepare donation request data
      const donationRequestData = {
        guestRequester: guest._id,
        bloodType,
        status: 'Active',
        expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default to 7 days
      };
      
      // Add hospital if provided
      if (hospitalId) {
        donationRequestData.hospital = hospitalId;
      }
      
      // Add donor if found
      if (donorToAssign) {
        donationRequestData.donor = donorToAssign;
      }
      
      // Create donation request
      const donationRequest = await DonationRequest.create(donationRequestData);
      
      // If we have a donor, find potential donors with matching blood type for notifications
      if (donorToAssign) {
        try {
          // Find potential donors with matching blood type
          const compatibleBloodTypes = getCompatibleBloodTypes(bloodType);
          
          const potentialDonors = await User.find({
            isDonor: true,
            bloodType: { $in: compatibleBloodTypes }
          }).limit(20);
          
          // Create notifications for potential donors (if notification system is implemented)
          if (global.Notification) {
            const notificationPromises = potentialDonors.map(donor => 
              global.Notification.create({
                recipient: donor._id,
                type: 'DonationRequest',
                title: `Blood Donation Need: ${bloodType}`,
                message: `Someone needs ${bloodType} blood donation. Can you help?`,
                relatedItem: {
                  itemType: 'DonationRequest',
                  itemId: donationRequest._id
                },
                priority: 'High'
              })
            );
            
            await Promise.all(notificationPromises);
          }
        } catch (notificationError) {
          console.error('Error sending notifications:', notificationError);
          // Continue even if notification sending fails
        }
      }
      
      res.status(201).json({ 
        success: true,
        donationRequest,
        guest: {
          id: guest._id,
          phoneNumber: guest.phoneNumber,
          createdAt: guest.createdAt
        }
      });
    } catch (err) {
      console.error('Error creating guest donation request:', err);
      res.status(500).json({ 
        success: false, 
        error: 'Server error',
        message: err.message
      });
    }
  },
  
  // Get all donation requests (with optional filtering)
  getDonationRequests: async (req, res) => {
    try {
      const { bloodType, status } = req.query;
      
      const filter = {};
      
      // Filter by blood type compatibility if specified
      if (bloodType) {
        filter.bloodType = bloodType;
      }
      
      // Filter by status
      if (status) {
        filter.status = status;
      } else {
        filter.status = 'Active'; // Default to active requests
      }
      
      // Filter by expiry date
      filter.expiryDate = { $gt: new Date() };
      
      const donationRequests = await DonationRequest.find(filter)
        .populate('requester', 'username phoneNumber')
        .populate('guestRequester', 'phoneNumber')
        .populate('hospital', 'name structure telephone wilaya')
        .sort({ createdAt: -1 });
      
      res.json(donationRequests);
    } catch (err) {
      console.error('Error fetching donation requests:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },
  
  // Get donation request by ID
  getDonationRequestById: async (req, res) => {
    try {
      const { requestId } = req.params;
      
      const donationRequest = await DonationRequest.findById(requestId)
        .populate('requester', 'username phoneNumber')
        .populate('guestRequester', 'phoneNumber')
        .populate('hospital', 'name structure telephone wilaya');
      
      if (!donationRequest) {
        return res.status(404).json({ error: 'Donation request not found' });
      }
      
      res.json(donationRequest);
    } catch (err) {
      console.error('Error fetching donation request:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },
  
  // Update donation request status
  updateDonationRequestStatus: async (req, res) => {
    try {
      const { requestId } = req.params;
      const { status } = req.body;
      
      const validStatuses = ['Active', 'Fulfilled', 'Cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      const donationRequest = await DonationRequest.findById(requestId);
      
      if (!donationRequest) {
        return res.status(404).json({ error: 'Donation request not found' });
      }
      
      // Check if user is the requester
      if (donationRequest.requester && donationRequest.requester.toString() !== req.user.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      donationRequest.status = status;
      await donationRequest.save();
      
      res.json(donationRequest);
    } catch (err) {
      console.error('Error updating donation request:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },
  
  // Get user's donation requests
  getUserDonationRequests: async (req, res) => {
    try {
      const donationRequests = await DonationRequest.find({ requester: req.user.userId })
        .populate('hospital', 'name structure telephone wilaya')
        .sort({ createdAt: -1 });
      
      res.json(donationRequests);
    } catch (err) {
      console.error('Error fetching user donation requests:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

// Helper function to get compatible blood types
function getCompatibleBloodTypes(bloodType) {
  const compatibilityMap = {
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    'AB-': ['A-', 'B-', 'AB-', 'O-'],
    'O+': ['O+', 'O-'],
    'O-': ['O-'],
    'Any': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  };
  
  return compatibilityMap[bloodType] || ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
}
