const DonationRequest = require('../models/DonationRequest');
const User = require('../models/User');
const Guest = require('../models/Guest');


const withTimeout = (promise, ms = 5000) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
};

module.exports = {

  createDonationRequest: async (req, res) => {
    try {
      const { bloodType, hospitalId, expiryDate, donorId, cityId } = req.body;
      

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

        }
      }


      const requestData = {
        requester: req.user.userId,
        bloodType,
        status: 'Active',
        expiryDate: new Date(expiryDate),
        cityId: cityId || null,
        wilayaName 
      };
      

      if (!requestData.cityId) {
        try {
          const user = await withTimeout(User.findById(req.user.userId), 3000);
          if (user && user.cityId) {
            requestData.cityId = user.cityId;
          }
        } catch (userErr) {
          console.error('Error getting user cityId:', userErr);

        }
      }
      

      if (hospitalId) {
        requestData.hospital = hospitalId;
      }
      

      if (donorId) {

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
      

      let potentialDonors = [];
      
      try {
        if (donorId) {

          potentialDonors = [{ _id: donorId }];
        } else {

          const compatibleBloodTypes = getCompatibleBloodTypes(bloodType);
          
          potentialDonors = await withTimeout(User.find({
            isDonor: true,
            bloodType: { $in: compatibleBloodTypes }
          }).limit(20), 4000);
        }
      } catch (donorFindErr) {
        console.error('Error finding potential donors:', donorFindErr);

      }
      

      if (global.Notification && potentialDonors.length > 0) {

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
                priority: donorId ? 'Urgent' : 'High' 
              })
            );
            
            await Promise.allSettled(notificationPromises);
            console.log(`Sent ${notificationPromises.length} notifications for donation request ${donationRequest._id}`);
          } catch (notifyErr) {
            console.error('Error sending notifications:', notifyErr);

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
  

  createGuestDonationRequest: async (req, res) => {
    try {
      const {
        guestId,
        phoneNumber,
        bloodType,
        hospitalId,
        expiryDate,
        donorId,
        cityId  
      } = req.body;
      

      if (!guestId && !phoneNumber) {
        return res.status(400).json({ 
          success: false, 
          error: 'Either guest ID or phone number is required' 
        });
      }
      

      if (!bloodType) {
        return res.status(400).json({
          success: false,
          error: 'Blood type is required'
        });
      }
      

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

        guest = await Guest.findOne({ phoneNumber });
        

        if (!guest) {
          guest = new Guest({
            phoneNumber,
            location: req.body.location || { 
              type: 'Point', 
              coordinates: [0, 0]
            }
          });
          await guest.save();
        }
        

        guest.lastActive = Date.now();
        await guest.save();
      }
      

      let donorToAssign = donorId;
      if (!donorToAssign) {
        const compatibleDonors = await User.find({
          isDonor: true,
          bloodType: bloodType
        }).limit(1);
        
        if (compatibleDonors.length > 0) {
          donorToAssign = compatibleDonors[0]._id;
        } else {

          donorToAssign = null;
        }
      }
      

      const donationRequestData = {
        guestRequester: guest._id,
        bloodType,
        status: 'Active',
        expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
        cityId: cityId || guest.cityId || null 
      };
      

      if (hospitalId) {
        donationRequestData.hospital = hospitalId;
      }
      

      if (donorToAssign) {
        donationRequestData.donor = donorToAssign;
      }
      

      const donationRequest = await DonationRequest.create(donationRequestData);
      

      if (donorToAssign) {
        try {

          const compatibleBloodTypes = getCompatibleBloodTypes(bloodType);
          
          const potentialDonors = await User.find({
            isDonor: true,
            bloodType: { $in: compatibleBloodTypes }
          }).limit(20);
          

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
  

  getDonationRequests: async (req, res) => {
    try {
      const { bloodType, status } = req.query;
      
      const filter = {};
      

      if (bloodType) {
        filter.bloodType = bloodType;
      }
      

      if (status) {
        filter.status = status;
      } else {
        filter.status = 'Active'; 
      }
      

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
  

  updateDonationRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const { bloodType, hospitalId, expiryDate, donorId, cityId } = req.body;
      

      const donationRequest = await DonationRequest.findById(id);
      
      if (!donationRequest) {
        return res.status(404).json({ 
          success: false, 
          message: 'Donation request not found' 
        });
      }
      

      if (donationRequest.requester && donationRequest.requester.toString() !== req.user.userId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Not authorized to update this donation request' 
        });
      }
      

      if (donationRequest.status !== 'Active') {
        return res.status(400).json({
          success: false,
          message: `Cannot update a donation request that is ${donationRequest.status.toLowerCase()}`
        });
      }
      

      if (bloodType) donationRequest.bloodType = bloodType;
      if (hospitalId) donationRequest.hospital = hospitalId;
      if (expiryDate) donationRequest.expiryDate = new Date(expiryDate);
      if (cityId) donationRequest.cityId = cityId;
      

      if (donorId) {

        const donor = await User.findById(donorId);
        if (!donor) {
          return res.status(404).json({
            success: false,
            message: 'Selected donor not found'
          });
        }
        donationRequest.donor = donorId;
      }
      

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
  

  getAllUserRequests: async (req, res) => {
    try {

      const userId = req.user && req.user.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      

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
  

  cancelDonationRequest: async (req, res) => {
    try {
      const { requestId } = req.params;
      const userId = req.user?.id || req.user?._id;


      const donationRequest = await DonationRequest.findById(requestId);
      
      if (!donationRequest) {
        return res.status(404).json({ 
          success: false, 
          message: 'Donation request not found' 
        });
      }
      

      if (donationRequest.requester && donationRequest.requester.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this donation request'
        });
      }
      

      if (donationRequest.status !== 'Active') {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel a donation request that is already ${donationRequest.status.toLowerCase()}`
        });
      }
      

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
  

  updateDonationRequest: async (req, res) => {
    try {
      const { requestId } = req.params;
      const updateData = req.body;
      const userId = req.user?.id || req.user?._id;


      const donationRequest = await DonationRequest.findById(requestId);
      
      if (!donationRequest) {
        return res.status(404).json({ 
          success: false, 
          message: 'Donation request not found' 
        });
      }
      

      if (donationRequest.requester && donationRequest.requester.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this donation request'
        });
      }
      

      if (donationRequest.status !== 'Active') {
        return res.status(400).json({
          success: false,
          message: `Cannot update a donation request that is ${donationRequest.status.toLowerCase()}`
        });
      }
      

      const allowedFields = ['bloodType', 'hospital', 'expiryDate', 'donor', 'cityId'];
      

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
  

  completeDonationRequest: async (req, res) => {
    try {
      const { requestId } = req.params;
      const userId = req.user?.id || req.user?._id;


      const donationRequest = await DonationRequest.findById(requestId);
      
      if (!donationRequest) {
        return res.status(404).json({ 
          success: false, 
          message: 'Donation request not found' 
        });
      }
      

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
      

      if (donationRequest.status !== 'Active') {
        return res.status(400).json({
          success: false,
          message: `Cannot complete a donation request that is ${donationRequest.status.toLowerCase()}`
        });
      }
      

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
  

  fulfillDonationRequest: async (req, res) => {
    try {
      const { requestId } = req.params;
      const userId = req.user?.id || req.user?._id;


      const donationRequest = await DonationRequest.findById(requestId);
      
      if (!donationRequest) {
        return res.status(404).json({ 
          success: false, 
          message: 'Donation request not found' 
        });
      }
      

      const user = await User.findById(userId);
      if (!user || !user.isDonor) {
        return res.status(403).json({
          success: false,
          message: 'Only donors can fulfill donation requests'
        });
      }
      

      if (donationRequest.status !== 'Active') {
        return res.status(400).json({
          success: false,
          message: `Cannot fulfill a donation request that is ${donationRequest.status.toLowerCase()}`
        });
      }
      

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
  

  deleteDonationRequest: async (req, res) => {
    try {
      const donationRequestId = req.params.requestId; 
      

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
