const User = require('../models/User');
const Donation = require('../models/Donation');

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