const DonationRequest = require('../models/DonationRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');

module.exports = {
  // Create a new donation request
  createDonationRequest: async (req, res) => {
    try {
      const {
        patientName,
        patientAge,
        bloodType,
        unitsNeeded,
        hospitalId,
        location,
        urgency,
        notes,
        expiryDate,
        contactPhone,
        contactEmail,
        preferredContactMethod
      } = req.body;
      
      const donationRequest = await DonationRequest.create({
        requester: req.user.userId,
        patient: {
          name: patientName,
          age: patientAge
        },
        bloodType,
        unitsNeeded,
        hospital: hospitalId,
        location: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude],
          address: location.address
        },
        urgency,
        status: 'Active',
        expiryDate: new Date(expiryDate),
        notes,
        contactInfo: {
          phone: contactPhone,
          email: contactEmail,
          preferredContactMethod
        }
      });
      
      // Find potential donors with matching blood type in the area
      const compatibleBloodTypes = getCompatibleBloodTypes(bloodType);
      
      const potentialDonors = await User.find({
        isDonor: true,
        bloodType: { $in: compatibleBloodTypes },
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [location.longitude, location.latitude]
            },
            $maxDistance: 50000 // 50km radius
          }
        }
      }).limit(20);
      
      // Create notifications for potential donors
      const notificationPromises = potentialDonors.map(donor => 
        Notification.create({
          recipient: donor._id,
          type: 'DonationRequest',
          title: `${urgency} Need: ${bloodType} Blood Donation`,
          message: `Someone near you needs ${bloodType} blood donation. Can you help?`,
          relatedItem: {
            itemType: 'DonationRequest',
            itemId: donationRequest._id
          },
          priority: urgency === 'Critical' ? 'Urgent' : 'High'
        })
      );
      
      await Promise.all(notificationPromises);
      
      res.status(201).json(donationRequest);
    } catch (err) {
      console.error('Error creating donation request:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },
  
  // Get all donation requests (with optional filtering)
  getDonationRequests: async (req, res) => {
    try {
      const { bloodType, status, distance, latitude, longitude } = req.query;
      
      const filter = {};
      
      // Filter by blood type compatibility if the user is a donor
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
      
      let donationRequests;
      
      // Filter by location if coordinates are provided
      if (latitude && longitude) {
        const maxDistance = distance ? parseInt(distance) * 1000 : 50000; // Convert km to meters
        
        donationRequests = await DonationRequest.find({
          ...filter,
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
              },
              $maxDistance: maxDistance
            }
          }
        })
        .populate('requester', 'username phoneNumber')
        .populate('hospital', 'name structure telephone wilaya')
        .sort({ urgency: -1, createdAt: -1 });
      } else {
        donationRequests = await DonationRequest.find(filter)
          .populate('requester', 'username phoneNumber')
          .populate('hospital', 'name structure telephone wilaya')
          .sort({ urgency: -1, createdAt: -1 });
      }
      
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
        .populate('hospital', 'name structure telephone wilaya')
        .populate('donorResponses.donor', 'username phoneNumber bloodType');
      
      if (!donationRequest) {
        return res.status(404).json({ error: 'Donation request not found' });
      }
      
      res.json(donationRequest);
    } catch (err) {
      console.error('Error fetching donation request:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },
  
  // Respond to a donation request
  respondToDonationRequest: async (req, res) => {
    try {
      const { requestId } = req.params;
      const { status } = req.body;
      
      const validResponses = ['Interested', 'Confirmed', 'Cancelled'];
      if (!validResponses.includes(status)) {
        return res.status(400).json({ error: 'Invalid response status' });
      }
      
      const donationRequest = await DonationRequest.findById(requestId);
      
      if (!donationRequest) {
        return res.status(404).json({ error: 'Donation request not found' });
      }
      
      if (donationRequest.status !== 'Active') {
        return res.status(400).json({ error: 'This request is no longer active' });
      }
      
      // Check if user already responded
      const existingResponseIndex = donationRequest.donorResponses.findIndex(
        response => response.donor.toString() === req.user.userId
      );
      
      if (existingResponseIndex !== -1) {
        // Update existing response
        donationRequest.donorResponses[existingResponseIndex].status = status;
        donationRequest.donorResponses[existingResponseIndex].responseDate = new Date();
      } else {
        // Add new response
        donationRequest.donorResponses.push({
          donor: req.user.userId,
          status
        });
      }
      
      await donationRequest.save();
      
      // Create notification for requester
      const donor = await User.findById(req.user.userId);
      
      await Notification.create({
        recipient: donationRequest.requester,
        type: 'DonationMatch',
        title: 'Donation Response',
        message: `${donor.username} has ${status.toLowerCase()} to your blood donation request`,
        relatedItem: {
          itemType: 'DonationRequest',
          itemId: donationRequest._id
        },
        priority: 'High'
      });
      
      res.json(donationRequest);
    } catch (err) {
      console.error('Error responding to donation request:', err);
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
      if (donationRequest.requester.toString() !== req.user.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      donationRequest.status = status;
      await donationRequest.save();
      
      // Notify responders if request is fulfilled or cancelled
      if (status === 'Fulfilled' || status === 'Cancelled') {
        const uniqueDonors = [...new Set(
          donationRequest.donorResponses
            .filter(response => response.status === 'Interested' || response.status === 'Confirmed')
            .map(response => response.donor.toString())
        )];
        
        const notificationPromises = uniqueDonors.map(donorId =>
          Notification.create({
            recipient: donorId,
            type: 'DonationRequest',
            title: `Donation Request ${status}`,
            message: `A donation request you responded to has been marked as ${status.toLowerCase()}`,
            relatedItem: {
              itemType: 'DonationRequest',
              itemId: donationRequest._id
            }
          })
        );
        
        await Promise.all(notificationPromises);
      }
      
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
