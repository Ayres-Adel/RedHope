const express = require('express');
const router = express.Router();
const Guest = require('../models/Guest');


router.post('/register', async (req, res) => {
  try {
    const { phoneNumber, location, cityId } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    

    let guest = await Guest.findOne({ phoneNumber });
    
    if (guest) {

      guest.lastActive = Date.now();
      if (location && location.coordinates) {
        guest.location = location;
        

        if (cityId) {
          guest.cityId = cityId;
          guest.lastCityUpdate = new Date();
        } else {
    
          try {
            const wilaya = await guest.updateCityFromCoordinates();
            if (wilaya) {
              console.log(`Updated guest cityId to ${guest.cityId} (${wilaya.name})`);
            }
          } catch (cityError) {
            console.error('Error updating guest cityId:', cityError);
          }
        }
      }
      await guest.save();
      return res.status(200).json({ 
        success: true, 
        guestId: guest._id, 
        createdAt: guest.createdAt, 
        lastActive: guest.lastActive,
        cityId: guest.cityId,
        isNewAccount: false,
        message: 'Guest updated successfully' 
      });
    }
    

    guest = new Guest({
      phoneNumber,
      location: location || {
        type: 'Point',
        coordinates: [0, 0] 
      },
      cityId: cityId || null, 
      lastCityUpdate: cityId ? new Date() : null
    });
    
    await guest.save();
    

    if (!cityId && location && location.coordinates && 
        location.coordinates[0] !== 0 && location.coordinates[1] !== 0) {
      try {
        const wilaya = await guest.updateCityFromCoordinates();
        if (wilaya) {
          console.log(`Set guest cityId to ${guest.cityId} (${wilaya.name})`);
        }
      } catch (cityError) {
        console.error('Error setting guest cityId:', cityError);
      }
    }
    

    req.session = req.session || {};
    req.session.guestId = guest._id;
    
    return res.status(201).json({ 
      success: true, 
      guestId: guest._id,
      createdAt: guest.createdAt,
      lastActive: guest.lastActive,
      cityId: guest.cityId,
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
        accountCreationDate: guest.createdAt, 
        lastActive: guest.lastActive,
        cityId: guest.cityId
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


router.post('/update-location', async (req, res) => {
  try {
    const { guestId, phoneNumber, location } = req.body;
    
    if (!guestId && !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Either guestId or phoneNumber is required'
      });
    }
    
    if (!location || !location.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required'
      });
    }
    

    let guest;
    if (guestId) {
      guest = await Guest.findById(guestId);
    } else if (phoneNumber) {
      guest = await Guest.findOne({ phoneNumber });
    }
    
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found'
      });
    }
    

    guest.location = location;
    guest.lastActive = Date.now();
    

    let wilayaName = null;
    try {
      const wilaya = await guest.updateCityFromCoordinates();
      if (wilaya) {
        wilayaName = wilaya.name;
      }
    } catch (cityError) {
      console.error('Error updating guest cityId:', cityError);
    }
    
    await guest.save();
    
    return res.status(200).json({
      success: true,
      guestId: guest._id,
      cityId: guest.cityId,
      wilayaName: wilayaName,
      lastActive: guest.lastActive,
      message: 'Guest location updated successfully'
    });
  } catch (err) {
    console.error('Error updating guest location:', err);
    return res.status(500).json({
      success: false,
      message: 'Error updating guest location',
      error: err.message
    });
  }
});


router.get('/:guestId', async (req, res) => {
  try {
    const guest = await Guest.findById(req.params.guestId);
    
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
        accountCreationDate: guest.createdAt,
        lastActive: guest.lastActive
      }
    });
  } catch (err) {
    console.error('Error fetching guest by ID:', err);
    return res.status(500).json({
      success: false,
      message: 'Error fetching guest',
      error: err.message
    });
  }
});

module.exports = router;
