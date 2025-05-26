const User = require('../models/User');
const mongoose = require('mongoose');


const handleError = (res, error, message) => {
  console.error(`Error: ${message}`, error);
  return res.status(500).json({
    success: false,
    message,
    error: error.message
  });
};


exports.getUserStats = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); 
    
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


exports.getDonationStats = async (req, res) => {
  try {
    const DonationRequest = require('../models/DonationRequest');
    
    const stats = await DonationRequest.aggregate([
      {
        $group: {
          _id: null,
          totalDonations: { $sum: 1 },
          activeDonations: {
            $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] }
          },
          fulfilledDonations: {
            $sum: { $cond: [{ $eq: ["$status", "Fulfilled"] }, 1, 0] }
          },
          expiredDonations: {
            $sum: { $cond: [{ $eq: ["$status", "Expired"] }, 1, 0] }
          },
          cancelledDonations: {
            $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] }
          }
        }
      }
    ]);
    
    return res.status(200).json({
      success: true,
      data: stats.length > 0 ? {
        totalDonations: stats[0].totalDonations,
        activeDonations: stats[0].activeDonations,
        fulfilledDonations: stats[0].fulfilledDonations,
        expiredDonations: stats[0].expiredDonations,
        cancelledDonations: stats[0].cancelledDonations
      } : {
        totalDonations: 0,
        activeDonations: 0,
        fulfilledDonations: 0,
        expiredDonations: 0,
        cancelledDonations: 0
      }
    });
  } catch (error) {
    return handleError(res, error, 'Error fetching donation statistics');
  }
};


exports.getDonationsList = async (req, res) => {
  try {

    const Donation = mongoose.model('Donation');
    

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    

    const query = {};
    

    if (req.query.status) {
      query.status = req.query.status;
    }
    

    if (req.query.bloodType) {
      query.bloodType = req.query.bloodType;
    }
    

    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    

    const donations = await Donation.find(query)
      .populate('donor', 'username email bloodType')
      .populate('hospital', 'name location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    

    const totalDonations = await Donation.countDocuments(query);
    

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


exports.getBloodSupply = async (req, res) => {
  try {

    const donors = await User.find({ isDonor: true }, 'bloodType');
    

    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const bloodSupply = Object.fromEntries(bloodTypes.map(type => [type, 'critical']));
    

    const bloodTypeCounts = {};
    donors.forEach(donor => {
      if (donor.bloodType && bloodTypes.includes(donor.bloodType)) {
        bloodTypeCounts[donor.bloodType] = (bloodTypeCounts[donor.bloodType] || 0) + 1;
      }
    });
    

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


exports.getBloodTypeStats = async (req, res) => {
  try {
    const { cityId, code, lat, lng, maxDistance } = req.query;
    

    const query = { isDonor: true };
    let locationName = "National";
    

    const cityCode = code || cityId;
    
    if (cityCode) {

      query.$or = [
        { cityCode: cityCode.toString() },
        { 'city.code': cityCode.toString() },
        { wilayaCode: cityCode.toString() },
        { code: cityCode.toString() },
        { cityId: cityCode.toString() }
      ];
      

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

    else if (lat && lng) {
      const distance = maxDistance || 50000; 
      
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
    

    const donors = await User.find(query, 'bloodType');
    

    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const bloodTypeCounts = Object.fromEntries(bloodTypes.map(type => [type, 0]));
    

    donors.forEach(donor => {
      if (donor.bloodType && bloodTypes.includes(donor.bloodType)) {
        bloodTypeCounts[donor.bloodType]++;
      }
    });
    

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