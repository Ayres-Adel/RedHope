const DonationRequest = require('../models/DonationRequest');
const User = require('../models/User');
const Guest = require('../models/Guest');

// Add timeout promise utility
const withTimeout = (promise, ms = 5000) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
};

module.exports = {
  // Create a new donation request
  createDonationRequest: async (req, res) => {
    try {
      const { bloodType, hospitalId, expiryDate, donorId, cityId } = req.body;
      
      // Get wilaya name from cityId if available
      let wilayaName = null;
      if (cityId) {
        try {
          const Wilaya = require('../models/Wilaya');
          const wilaya = await withTimeout(Wilaya.findOne({ code: cityId }), 3000);
          if (wilaya) {
            wilayaName = wilaya.name;
          }
        } catch (wilayaErr) {
          console.error('Error fetching wilaya:', wilayaErr);
          // Continue without wilaya name
        }
      }

      // Create request data
      const requestData = {
        requester: req.user.userId,
        bloodType,
        status: 'Active',
        expiryDate: new Date(expiryDate),
        cityId: cityId || null,
        wilayaName // Include wilayaName in the request data
      };
      
      // If no cityId provided directly, try to get it from user
      if (!requestData.cityId) {
        try {
          const user = await withTimeout(User.findById(req.user.userId), 3000);
          if (user && user.cityId) {
            requestData.cityId = user.cityId;
          }
        } catch (userErr) {
          console.error('Error getting user cityId:', userErr);
          // Continue without cityId if there's an error
        }
      }
      
      // Add hospital if provided
      if (hospitalId) {
        requestData.hospital = hospitalId;
      }
      
      // Add donor if provided
      if (donorId) {
        // Verify the donor exists
        try {
          const donor = await withTimeout(User.findById(donorId), 3000);
          if (!donor) {
            return res.status(404).json({ 
              success: false,
              error: 'Selected donor not found' 
            });
          }
          requestData.donor = donorId;
        } catch (donorErr) {
          console.error('Error finding donor:', donorErr);
          return res.status(500).json({
            success: false,
            error: 'Error verifying donor',
            message: donorErr.message
          });
        }
      }
      
      const donationRequest = await withTimeout(DonationRequest.create(requestData), 5000);
      
      // Determine which donors to notify
      let potentialDonors = [];
      
      try {
        if (donorId) {
          // If a specific donor was selected, only notify that donor
          potentialDonors = [{ _id: donorId }];
        } else {
          // Otherwise find potential donors with matching blood type
          const compatibleBloodTypes = getCompatibleBloodTypes(bloodType);
          
          potentialDonors = await withTimeout(User.find({
            isDonor: true,
            bloodType: { $in: compatibleBloodTypes }
          }).limit(20), 4000);
        }
      } catch (donorFindErr) {
        console.error('Error finding potential donors:', donorFindErr);
        // Continue without sending notifications if this fails
      }
      
      // Create notifications for potential donors - make non-blocking
      if (global.Notification && potentialDonors.length > 0) {
        // Don't await this - run in background
        (async () => {
          try {
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
            
            await Promise.allSettled(notificationPromises);
            console.log(`Sent ${notificationPromises.length} notifications for donation request ${donationRequest._id}`);
          } catch (notifyErr) {
            console.error('Error sending notifications:', notifyErr);
            // Errors in background process won't affect response
          }
        })();
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
        donorId,
        cityId  // Add cityId parameter to request body
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
        expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days
        cityId: cityId || guest.cityId || null // Prioritize provided cityId, then fallback to guest's cityId
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
  
  // Update donation request
  updateDonationRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const { bloodType, hospitalId, expiryDate, donorId, cityId } = req.body;
      
      // Find the donation request
      const donationRequest = await DonationRequest.findById(id);
      
      if (!donationRequest) {
        return res.status(404).json({ 
          success: false, 
          message: 'Donation request not found' 
        });
      }
      
      // Check if user is authorized to update this request
      if (donationRequest.requester && donationRequest.requester.toString() !== req.user.userId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Not authorized to update this donation request' 
        });
      }
      
      // Check if request can be updated (not fulfilled or cancelled)
      if (donationRequest.status !== 'Active') {
        return res.status(400).json({
          success: false,
          message: `Cannot update a donation request that is ${donationRequest.status.toLowerCase()}`
        });
      }
      
      // Update fields if provided
      if (bloodType) donationRequest.bloodType = bloodType;
      if (hospitalId) donationRequest.hospital = hospitalId;
      if (expiryDate) donationRequest.expiryDate = new Date(expiryDate);
      if (cityId) donationRequest.cityId = cityId;
      
      // Update donor if provided
      if (donorId) {
        // Verify the donor exists
        const donor = await User.findById(donorId);
        if (!donor) {
          return res.status(404).json({
            success: false,
            message: 'Selected donor not found'
          });
        }
        donationRequest.donor = donorId;
      }
      
      // Save the updated request
      await donationRequest.save();
      
      res.status(200).json({
        success: true,
        message: 'Donation request updated successfully',
        data: donationRequest
      });
    } catch (err) {
      console.error('Error updating donation request:', err);
      res.status(500).json({
        success: false,
        message: 'Server error while updating donation request',
        error: err.message
      });
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
  },
  
  // Get donation requests where the authenticated user is a donor
  getUserDonorRequests: async (req, res) => {
    try {
      const donorId = req.user.id;
      
      const donationRequests = await DonationRequest.find({ donorId })
        .populate('hospitalId', 'name location')
        .populate('cityId', 'name wilayaCode')
        .populate('userId', 'name phoneNumber')
        .sort({ createdAt: -1 });
      
      res.status(200).json({
        success: true,
        count: donationRequests.length,
        data: donationRequests
      });
    } catch (error) {
      console.error('Error getting user donor requests:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving donor requests',
        error: error.message
      });
    }
  },
  
  // Get all requests where user is either requester or donor
  getAllUserRequests: async (req, res) => {
    try {
      // Get authenticated user ID from req.user
      const userId = req.user && req.user.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Find all requests where user is either requester or donor
      const requests = await DonationRequest.find({
        $or: [
          { requester: userId },
          { donor: userId }
        ]
      })
      .populate('requester', 'username email')
      .populate('guestRequester', 'phoneNumber')
      .populate('donor', 'username email')
      .populate('hospital', 'name location')
      .sort({ createdAt: -1 });
      
      res.status(200).json(requests);
    } catch (err) {
      console.error("Error in getAllUserRequests:", err);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving user requests',
        error: err.message
      });
    }
  },
  
  // Cancel donation request
  cancelDonationRequest: async (req, res) => {
    try {
      const { requestId } = req.params;
      const userId = req.user?.id || req.user?._id;

      // Find the donation request
      const donationRequest = await DonationRequest.findById(requestId);
      
      if (!donationRequest) {
        return res.status(404).json({ 
          success: false, 
          message: 'Donation request not found' 
        });
      }
      
      // Check if user is authorized (either requester or admin)
      if (donationRequest.requester && donationRequest.requester.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this donation request'
        });
      }
      
      // Check if request can be cancelled (not already fulfilled or cancelled)
      if (donationRequest.status !== 'Active') {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel a donation request that is already ${donationRequest.status.toLowerCase()}`
        });
      }
      
      // Update the status to Cancelled
      donationRequest.status = 'Cancelled';
      await donationRequest.save();
      
      return res.status(200).json({
        success: true,
        message: 'Donation request cancelled successfully',
        data: donationRequest
      });
    } catch (error) {
      console.error('Error cancelling donation request:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel donation request',
        error: error.message
      });
    }
  },
  
  // Update donation request
  updateDonationRequest: async (req, res) => {
    try {
      const { requestId } = req.params;
      const updateData = req.body;
      const userId = req.user?.id || req.user?._id;

      // Find the donation request
      const donationRequest = await DonationRequest.findById(requestId);
      
      if (!donationRequest) {
        return res.status(404).json({ 
          success: false, 
          message: 'Donation request not found' 
        });
      }
      
      // Check if user is authorized to update this request
      if (donationRequest.requester && donationRequest.requester.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this donation request'
        });
      }
      
      // Check if request can be updated (not fulfilled or cancelled)
      if (donationRequest.status !== 'Active') {
        return res.status(400).json({
          success: false,
          message: `Cannot update a donation request that is ${donationRequest.status.toLowerCase()}`
        });
      }
      
      // Fields that can be updated
      const allowedFields = ['bloodType', 'hospital', 'expiryDate', 'donor', 'cityId'];
      
      // Update only allowed fields
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          donationRequest[field] = updateData[field];
        }
      }
      
      await donationRequest.save();
      
      return res.status(200).json({
        success: true,
        message: 'Donation request updated successfully',
        data: donationRequest
      });
    } catch (error) {
      console.error('Error updating donation request:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update donation request',
        error: error.message
      });
    }
  },
  
  // Complete donation request
  completeDonationRequest: async (req, res) => {
    try {
      const { requestId } = req.params;
      const userId = req.user?.id || req.user?._id;

      // Find the donation request
      const donationRequest = await DonationRequest.findById(requestId);
      
      if (!donationRequest) {
        return res.status(404).json({ 
          success: false, 
          message: 'Donation request not found' 
        });
      }
      
      // Check authorization: requester or donor can complete
      const isRequester = donationRequest.requester && 
        donationRequest.requester.toString() === userId.toString();
      const isDonor = donationRequest.donor && 
        donationRequest.donor.toString() === userId.toString();
        
      if (!isRequester && !isDonor) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to complete this donation request'
        });
      }
      
      // Check if request can be completed (must be active)
      if (donationRequest.status !== 'Active') {
        return res.status(400).json({
          success: false,
          message: `Cannot complete a donation request that is ${donationRequest.status.toLowerCase()}`
        });
      }
      
      // Update the status to Fulfilled
      donationRequest.status = 'Fulfilled';
      donationRequest.completedAt = new Date();
      await donationRequest.save();
      
      return res.status(200).json({
        success: true,
        message: 'Donation request completed successfully',
        data: donationRequest
      });
    } catch (error) {
      console.error('Error completing donation request:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to complete donation request',
        error: error.message
      });
    }
  },
  
  // Fulfill donation request
  fulfillDonationRequest: async (req, res) => {
    try {
      const { requestId } = req.params;
      const userId = req.user?.id || req.user?._id;

      // Find the donation request
      const donationRequest = await DonationRequest.findById(requestId);
      
      if (!donationRequest) {
        return res.status(404).json({ 
          success: false, 
          message: 'Donation request not found' 
        });
      }
      
      // Check if user is a donor (only donors can fulfill requests)
      const user = await User.findById(userId);
      if (!user || !user.isDonor) {
        return res.status(403).json({
          success: false,
          message: 'Only donors can fulfill donation requests'
        });
      }
      
      // Check if request can be fulfilled (must be active)
      if (donationRequest.status !== 'Active') {
        return res.status(400).json({
          success: false,
          message: `Cannot fulfill a donation request that is ${donationRequest.status.toLowerCase()}`
        });
      }
      
      // Update the request with donor info and status
      donationRequest.donor = userId;
      donationRequest.status = 'Fulfilled';
      donationRequest.fulfilledAt = new Date();
      await donationRequest.save();
      
      return res.status(200).json({
        success: true,
        message: 'Donation request fulfilled successfully',
        data: donationRequest
      });
    } catch (error) {
      console.error('Error fulfilling donation request:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fulfill donation request',
        error: error.message
      });
    }
  },
  
  // Delete a donation request
  deleteDonationRequest: async (req, res) => {
    try {
      const donationRequestId = req.params.requestId; // Changed from req.params.id to req.params.requestId
      
      // Find and delete the donation request
      const deletedRequest = await DonationRequest.findByIdAndDelete(donationRequestId);
      
      if (!deletedRequest) {
        return res.status(404).json({ success: false, message: 'Donation request not found' });
      }
      
      return res.json({ 
        success: true, 
        message: 'Donation request deleted successfully',
        data: deletedRequest
      });
    } catch (error) {
      console.error('Error deleting donation request:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete donation request',
        error: error.message 
      });
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
