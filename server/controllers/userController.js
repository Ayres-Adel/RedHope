// controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcrypt');

module.exports = {
  // Get user profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.userId)
        .select('-password -__v'); // Exclude sensitive fields
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        username: user.username,
        email: user.email,
        phone: user.phoneNumber,
        bloodType: user.bloodType,
        location: user.location,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        isDonor: user.isDonor
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Change password
  changePassword: async (req, res) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    try {
        // 1. Check if new passwords match
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ error: 'New passwords do not match' });
        }

        // 2. Fetch user using plain findById
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 3. Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // 4. MANUALLY hash and save (to ensure pre-save hook runs)
        user.password = newPassword; // Set the new plaintext password
        await user.save(); // This triggers the pre('save') hook to hash it

        res.json({ message: 'Password changed successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
},

  // Delete account
  deleteAccount: async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.user.userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'Account deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
};