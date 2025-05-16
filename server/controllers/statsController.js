const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Standard error response handler
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {String} message - Custom error message
 */
const handleError = (res, error, message) => {
  console.error(`Error: ${message}`, error);
  return res.status(500).json({
    success: false,
    message,
    error: error.message
  });
};

/**
 * Get user statistics
 * @route GET /api/stats/users
 */
exports.getUserStats = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude password field
    
    const totalUsers = users.length;
    const totalDonors = users.filter(user => user.isDonor).length;
    
    return res.status(200).json({
      success: true,
      data: {
        users,
        totalUsers,
        totalDonors
      }
    });
  } catch (error) {
    return handleError(res, error, 'Error fetching user statistics');
  }
};

/**
 * Get donation statistics (summary metrics only)
 * @route GET /api/stats/donations/stats
 */
exports.getDonationStats = async (req, res) => {
  try {
    // Connect to Donation model
    const Donation = mongoose.model('Donation');
    
    // Aggregate statistics without fetching all donation records
    const stats = await Donation.aggregate([
      {
        $group: {
          _id: null,
          totalDonations: { $sum: 1 },
          pendingRequests: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] }
          },
          completedDonations: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] }
          }
        }
      }
    ]);
    
    // Format the response
    return res.status(200).json({
      success: true,
      data: stats.length > 0 ? {
        totalDonations: stats[0].totalDonations,
        pendingRequests: stats[0].pendingRequests,
        completedDonations: stats[0].completedDonations
      } : {
        totalDonations: 0,
        pendingRequests: 0, 
        completedDonations: 0
      }
    });
  } catch (error) {
    return handleError(res, error, 'Error fetching donation statistics');
  }
};

/**
 * Get detailed donation list with pagination
 * @route GET /api/stats/donations/list
 */
exports.getDonationsList = async (req, res) => {
  try {
    // Connect to Donation model
    const Donation = mongoose.model('Donation');
    
    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build query based on filters
    const query = {};
    
    // Add status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Add blood type filter if provided
    if (req.query.bloodType) {
      query.bloodType = req.query.bloodType;
    }
    
    // Add date range filter if provided
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Fetch donations with pagination
    const donations = await Donation.find(query)
      .populate('donor', 'username email bloodType')
      .populate('hospital', 'name location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const totalDonations = await Donation.countDocuments(query);
    
    // Return the results
    return res.status(200).json({
      success: true,
      data: {
        donations,
        pagination: {
          total: totalDonations,
          page,
          pages: Math.ceil(totalDonations / limit),
          limit
        }
      }
    });
  } catch (error) {
    return handleError(res, error, 'Error fetching donation list');
  }
};

/**
 * Get blood supply status
 * @route GET /api/stats/blood-supply
 */
exports.getBloodSupply = async (req, res) => {
  try {
    // Get only necessary fields for performance
    const donors = await User.find({ isDonor: true }, 'bloodType');
    
    // Calculate blood supply status
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const bloodSupply = Object.fromEntries(bloodTypes.map(type => [type, 'critical']));
    
    // Count donors by blood type
    const bloodTypeCounts = {};
    donors.forEach(donor => {
      if (donor.bloodType && bloodTypes.includes(donor.bloodType)) {
        bloodTypeCounts[donor.bloodType] = (bloodTypeCounts[donor.bloodType] || 0) + 1;
      }
    });
    
    // Update status based on counts
    Object.entries(bloodTypeCounts).forEach(([type, count]) => {
      if (count >= 10) {
        bloodSupply[type] = 'stable';
      } else if (count >= 5) {
        bloodSupply[type] = 'low';
      }
    });
    
    return res.status(200).json({
      success: true,
      data: bloodSupply
    });
  } catch (error) {
    return handleError(res, error, 'Error calculating blood supply');
  }
};

/**
 * Get blood type distribution statistics
 * @route GET /api/stats/blood-types
 */
exports.getBloodTypeStats = async (req, res) => {
  try {
    const { cityId, code, lat, lng, maxDistance } = req.query;
    
    // Build the query for donors
    const query = { isDonor: true };
    let locationName = "National";
    
    // City can be specified either by cityId or code parameter
    const cityCode = code || cityId;
    
    if (cityCode) {
      // Use $or for multiple possible field matches
      query.$or = [
        { cityCode: cityCode.toString() },
        { 'city.code': cityCode.toString() },
        { wilayaCode: cityCode.toString() },
        { code: cityCode.toString() },
        { cityId: cityCode.toString() }
      ];
      
      // Find city name for display purposes
      try {
        const City = mongoose.model('City');
        const city = await City.findOne({ code: cityCode.toString() });
        
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
    
    // Get only necessary fields for performance
    const donors = await User.find(query, 'bloodType');
    
    // Initialize all blood type counts
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const bloodTypeCounts = Object.fromEntries(bloodTypes.map(type => [type, 0]));
    
    // Count donors by blood type
    donors.forEach(donor => {
      if (donor.bloodType && bloodTypes.includes(donor.bloodType)) {
        bloodTypeCounts[donor.bloodType]++;
      }
    });
    
    // Return the stats
    return res.status(200).json({
      success: true,
      data: {
        bloodTypes: bloodTypeCounts,
        totalDonors: donors.length,
        location: locationName
      }
    });
  } catch (error) {
    return handleError(res, error, 'Error fetching blood type statistics');
  }
};

/**
 * Update user cities based on coordinates
 * @route POST /api/stats/update-cities
 */
exports.updateUserCities = async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const User = mongoose.model('user');
    const result = await User.bulkUpdateCitiesFromCoordinates(parseInt(limit));
    
    return res.status(200).json({
      success: true,
      message: `Processed ${result.processed} users, updated ${result.updated} with city information`,
      data: result
    });
  } catch (error) {
    return handleError(res, error, 'Error updating user cities');
  }
};