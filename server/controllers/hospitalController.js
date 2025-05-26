const Hospital = require('../models/Hospital');

module.exports = {
  // Get all hospitals
  getAllHospitals: async (req, res) => {
    try {
      // Extract pagination and search parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const sort = req.query.sort || 'name';
      const order = req.query.order === 'desc' ? -1 : 1;
      
      // Build query with search filter
      const query = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { wilaya: { $regex: search, $options: 'i' } },
          { structure: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Get total count for pagination
      const totalItems = await Hospital.countDocuments(query);
      
      // Fetch hospitals from database with pagination and sorting
      let sortOptions = {};
      sortOptions[sort] = order;
      
      const hospitals = await Hospital.find(query)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      
      res.json({
        success: true,
        hospitals: hospitals,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit) || 1,
          totalItems: totalItems,
          itemsPerPage: limit
        }
      });
    } catch (err) {
      console.error('Controller: Error fetching hospitals from database:', err);
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
  },

  // Add this utility function to seed hospitals if needed
  seedHospitals: async (req, res) => {
    try {
      const count = await Hospital.countDocuments();
      
      if (count > 0) {
        return res.json({
          success: true,
          message: `Database already contains ${count} hospitals`,
          seeded: false
        });
      }
      
      const fs = require('fs');
      const path = require('path');
      const hospitalsPath = path.join(__dirname, '../../my-react-app/src/assets/Hospitals.json');
      
      const hospitalsData = JSON.parse(fs.readFileSync(hospitalsPath, 'utf8'));
      
      if (!hospitalsData.hospitals || !Array.isArray(hospitalsData.hospitals)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid hospital data format' 
        });
      }
      
      const formattedHospitals = hospitalsData.hospitals.map(hospital => ({
        name: hospital.name,
        structure: hospital.structure,
        location: {
          type: 'Point',
          coordinates: [hospital.longitude, hospital.latitude]        },
        telephone: hospital.telephone,
        fax: hospital.fax,
        wilaya: hospital.wilaya
      }));
      
    } catch (err) {
      console.error('Error seeding hospitals:', err);
      res.status(500).json({ success: false, error: 'Server error', message: err.message });
    }
  }
};
