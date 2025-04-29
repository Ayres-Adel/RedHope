const User = require('../models/User');
const Donation = require('../models/Donation');
const mongoose = require('mongoose');

exports.getUserStats = async (req, res) => {
  try {
    // Get all users from database
    const users = await User.find({});
    
    const totalUsers = users.length;
    const totalDonors = users.filter(user => user.isDonor).length;
    
    res.status(200).json({
      success: true,
      users: users,
      totalUsers,
      totalDonors
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics'
    });
  }
};

exports.getDonationStats = async (req, res) => {
  try {
    // Get all donations from database
    const donations = await Donation.find({})
      .populate('donor', 'username email bloodType')
      .populate('hospital', 'name location');
    
    const totalDonations = donations.length;
    const pendingRequests = donations.filter(d => d.status === 'Pending').length;
    
    res.status(200).json({
      success: true,
      donations: donations,
      totalDonations,
      pendingRequests
    });
  } catch (error) {
    console.error('Error fetching donation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching donation statistics'
    });
  }
};

exports.getBloodSupply = async (req, res) => {
  try {
    // Get users who are donors
    const donors = await User.find({ isDonor: true });
    
    // Calculate blood supply status
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const bloodSupply = {};
    
    // Initialize all as critical
    bloodTypes.forEach(type => {
      bloodSupply[type] = 'critical';
    });
    
    // Update based on donor counts
    bloodTypes.forEach(type => {
      const count = donors.filter(d => d.bloodType === type).length;
      
      if (count >= 10) {
        bloodSupply[type] = 'stable';
      } else if (count >= 5) {
        bloodSupply[type] = 'low';
      }
    });
    
    res.status(200).json(bloodSupply);
  } catch (error) {
    console.error('Error getting blood supply:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating blood supply'
    });
  }
};

/**
 * Get blood type distribution statistics
 * This endpoint returns the count of users with each blood type,
 * optionally filtered by city
 */
exports.getBloodTypeStats = async (req, res) => {
  try {
    const { cityId, lat, lng, maxDistance } = req.query;
    
    // Build the query - filter by city if provided
    let query = { isDonor: true };
    let locationName = "National";
    
    if (cityId) {
      // Try to match by city ID (MongoDB ObjectId) or city code (string)
      query.$or = [
        { city: mongoose.Types.ObjectId.isValid(cityId) ? mongoose.Types.ObjectId(cityId) : null },
        { cityId: cityId.toString() }
      ];
      
      // Try to get city name
      try {
        const City = mongoose.model('City');
        const city = await City.findById(cityId).select('name');
        if (city) {
          locationName = city.name;
        }
      } catch (err) {
        console.warn('Could not get city name:', err);
      }
    } 
    // If coordinates are provided, find by proximity
    else if (lat && lng) {
      const distance = maxDistance || 50000; // 50km default radius
      
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(distance)
        }
      };
      
      locationName = `Within ${parseInt(distance)/1000}km radius`;
    }
    
    console.log('Query for blood stats:', JSON.stringify(query));
    
    // Get all donors matching the query
    const donors = await User.find(query);
    
    // Initialize counters for all blood types
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const bloodTypeCounts = {};
    
    bloodTypes.forEach(type => {
      bloodTypeCounts[type] = 0;
    });
    
    // Count donors by blood type
    donors.forEach(donor => {
      if (donor.bloodType && bloodTypes.includes(donor.bloodType)) {
        bloodTypeCounts[donor.bloodType]++;
      }
    });
    
    // Return the count of each blood type
    res.status(200).json({
      success: true,
      data: {
        bloodTypes: bloodTypeCounts,
        totalDonors: donors.length,
        location: locationName
      }
    });
  } catch (error) {
    console.error('Error fetching blood type statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blood type statistics',
      error: error.message
    });
  }
};

// Add a new endpoint to update user cities based on coordinates
exports.updateUserCities = async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const User = mongoose.model('user');
    const result = await User.bulkUpdateCitiesFromCoordinates(parseInt(limit));
    
    res.status(200).json({
      success: true,
      message: `Processed ${result.processed} users, updated ${result.updated} with city information`,
      data: result
    });
  } catch (error) {
    console.error('Error updating user cities:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user cities',
      error: error.message
    });
  }
};