const Hospital = require('../models/Hospital');

module.exports = {
  // Get all hospitals
  getAllHospitals: async (req, res) => {
    try {
      const hospitals = await Hospital.find();
      res.json(hospitals);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get hospitals by wilaya
  getHospitalsByWilaya: async (req, res) => {
    try {
      const { wilaya } = req.params;
      const hospitals = await Hospital.find({ 
        wilaya: new RegExp(wilaya, 'i') // Case insensitive search
      });
      res.json(hospitals);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get hospitals near location
  getHospitalsNearby: async (req, res) => {
    try {
      const { longitude, latitude, maxDistance = 10000 } = req.query; // maxDistance in meters, default 10km

      if (!longitude || !latitude) {
        return res.status(400).json({ error: 'Longitude and latitude are required' });
      }

      const hospitals = await Hospital.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: parseFloat(maxDistance)
          }
        }
      });

      res.json(hospitals);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
};
