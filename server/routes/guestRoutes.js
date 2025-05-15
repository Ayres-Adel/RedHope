const express = require('express');
const router = express.Router();
const Guest = require('../models/Guest');

// Create a new guest
router.post('/register', async (req, res) => {
  try {
    const { phoneNumber, location } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    
    // Check if guest already exists
    let guest = await Guest.findOne({ phoneNumber });
    
    if (guest) {
      // Update last active time and location if guest exists
      guest.lastActive = Date.now();
      if (location && location.coordinates) {
        guest.location = location;
      }
      await guest.save();
      return res.status(200).json({ 
        success: true, 
        guestId: guest._id, 
        createdAt: guest.createdAt, 
        lastActive: guest.lastActive,
        isNewAccount: false,
        message: 'Guest updated successfully' 
      });
    }
    
    // Create new guest
    guest = new Guest({
      phoneNumber,
      location: location || {
        type: 'Point',
        coordinates: [0, 0] // Default coordinates
      }
    });
    
    await guest.save();
    
    // Store guest ID in session
    req.session = req.session || {};
    req.session.guestId = guest._id;
    
    return res.status(201).json({ 
      success: true, 
      guestId: guest._id,
      createdAt: guest.createdAt,
      lastActive: guest.lastActive,
      isNewAccount: true,
      message: 'Guest registered successfully'
    });
  } catch (err) {
    console.error('Guest registration error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Error registering guest',
      error: err.message
    });
  }
});

// Get guest by phone number
router.get('/phone/:phoneNumber', async (req, res) => {
  try {
    const guest = await Guest.findOne({ phoneNumber: req.params.phoneNumber });
    
    if (!guest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Guest not found' 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      guest: {
        ...guest.toObject(),
        registeredOn: guest.createdAt,
        accountCreationDate: guest.createdAt, // Added explicit account creation date
        lastActive: guest.lastActive
      }
    });
  } catch (err) {
    console.error('Error fetching guest:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching guest',
      error: err.message
    });
  }
});

module.exports = router;
