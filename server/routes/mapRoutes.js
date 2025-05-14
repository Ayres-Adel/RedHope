const { Router } = require('express');
const mongoose = require('mongoose');
const router = Router();
const Hospital = require('../models/Hospital');

// Add error handling wrapper function
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error(`Map API Error: ${error.message}`);
    return res.status(500).json({ 
      success: false, 
      message: "An error occurred while processing your request",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      data: { locations: [] } // Return empty locations to prevent UI errors
    });
  });
};

// Get all hospitals for map
router.get('/hospitals', asyncHandler(async (req, res) => {
  const hospitals = await Hospital.find()
    .select('name location address contactInfo wilaya type')
    .lean();
  
  return res.status(200).json({
    success: true,
    count: hospitals.length,
    data: {
      locations: hospitals.map(hospital => ({
        id: hospital._id,
        name: hospital.name,
        type: 'hospital',
        position: hospital.location && hospital.location.coordinates ? {
          lat: hospital.location.coordinates[1],
          lng: hospital.location.coordinates[0]
        } : { lat: 36.16, lng: 1.33 }, // Default coordinates if none provided
        address: hospital.address,
        contact: hospital.contactInfo,
        wilaya: hospital.wilaya,
        category: hospital.type
      }))
    }
  });
}));

// Debug endpoint to check if map API is working
router.get('/status', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Map API is operational',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
