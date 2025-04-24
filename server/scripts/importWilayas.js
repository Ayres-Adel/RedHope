const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import Wilaya model
const Wilaya = require('../models/Wilaya');

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Read wilayas data from JSON file
const wilayasFilePath = path.join(__dirname, '../../my-react-app/src/assets/wilayas_algerie.json');
const wilayasData = JSON.parse(fs.readFileSync(wilayasFilePath, 'utf8'));

async function importWilayas() {
  try {
    // Check if wilayas already exist
    const count = await Wilaya.countDocuments();
    if (count > 0) {
      console.log(`Found ${count} existing wilayas. Clearing collection before import...`);
      await Wilaya.deleteMany({});
    }

    // Insert wilayas into MongoDB
    const result = await Wilaya.insertMany(wilayasData);
    console.log(`Successfully imported ${result.length} wilayas to MongoDB`);
  } catch (error) {
    console.error('Error importing wilayas:', error);
  } finally {
    mongoose.connection.close();
  }
}

importWilayas();
