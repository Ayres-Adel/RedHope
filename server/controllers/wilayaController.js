const Wilaya = require('../models/Wilaya');

module.exports = {
  // Get all wilayas
  getAllWilayas: async (req, res) => {
    try {
      const wilayas = await Wilaya.find().sort({ name: 1 });
      res.json(wilayas);
    } catch (err) {
      console.error('Error fetching wilayas:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get wilaya by code
  getWilayaByCode: async (req, res) => {
    try {
      const { code } = req.params;
      const wilaya = await Wilaya.findOne({ code });
      
      if (!wilaya) {
        return res.status(404).json({ error: 'Wilaya not found' });
      }
      
      res.json(wilaya);
    } catch (err) {
      console.error('Error fetching wilaya:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get wilayas near a location
  getWilayasNearby: async (req, res) => {
    try {
      const { latitude, longitude, distance = 100 } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }

      // Convert distance to radians (assuming kilometers and Earth radius of 6371 km)
      const maxDistanceInRadians = parseFloat(distance) / 6371;
      
      const wilayas = await Wilaya.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
            distanceField: "distance",
            maxDistance: parseFloat(distance) * 1000, // Convert km to meters
            spherical: true
          }
        }
      ]);
      
      res.json(wilayas);
    } catch (err) {
      console.error('Error fetching nearby wilayas:', err);
      res.status(500).json({ error: 'Server error', message: err.message });
    }
  },
  
  // Get blood centers
  getBloodCenters: async (req, res) => {
    try {
      const wilayas = await Wilaya.find({}, 'name blood_centers');
      
      // Extract and flatten all blood centers
      const bloodCenters = wilayas.flatMap(wilaya => 
        wilaya.blood_centers.map(center => ({
          ...center.toObject(),
          wilaya: wilaya.name
        }))
      );
      
      res.json(bloodCenters);
    } catch (err) {
      console.error('Error fetching blood centers:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },
  
  // Get blood centers by wilaya code
  getBloodCentersByWilaya: async (req, res) => {
    try {
      const { code } = req.params;
      const wilaya = await Wilaya.findOne({ code });
      
      if (!wilaya) {
        return res.status(404).json({ error: 'Wilaya not found' });
      }
      
      res.json(wilaya.blood_centers);
    } catch (err) {
      console.error('Error fetching blood centers:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
};
