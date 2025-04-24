const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import Hospital model
const Hospital = require('../models/Hospital');

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Read hospitals data from JSON file
const hospitalsFilePath = path.join(__dirname, '../../my-react-app/src/assets/Hospitals.json');
const hospitalsData = JSON.parse(fs.readFileSync(hospitalsFilePath, 'utf8'));

async function importHospitals() {
  try {
    // Check if hospitals already exist
    const count = await Hospital.countDocuments();
    if (count > 0) {
      console.log(`Found ${count} existing hospitals. Clearing collection before import...`);
      await Hospital.deleteMany({});
    }

    // Transform data to match our schema
    const hospitals = hospitalsData.hospitals.map(hospital => ({
      name: hospital.name,
      structure: hospital.structure,
      location: {
        type: 'Point',
        coordinates: [hospital.longitude, hospital.latitude] // GeoJSON format: [longitude, latitude]
      },
      telephone: hospital.telephone,
      fax: hospital.fax,
      wilaya: hospital.wilaya.charAt(0).toUpperCase() + hospital.wilaya.slice(1).toLowerCase() // Normalize wilaya names
    }));

    // Insert hospitals into MongoDB
    const result = await Hospital.insertMany(hospitals);
    console.log(`Successfully imported ${result.length} hospitals to MongoDB`);
  } catch (error) {
    console.error('Error importing hospitals:', error);
  } finally {
    mongoose.connection.close();
  }
}

importHospitals();
