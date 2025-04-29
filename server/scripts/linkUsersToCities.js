/**
 * Migration script to link users with their cities
 * Run with: node scripts/linkUsersToCities.js
 */
const mongoose = require('mongoose');
require('dotenv').config(); // Add dotenv to load environment variables from .env file
require('../models/User');
require('../models/Wilaya');

// Get MongoDB URI directly from the environment or use the hardcoded one if .env fails
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://RedHope:fA3EOSfjsYSoNfhe@cluster0.akz2l.mongodb.net/';
console.log("MongoDB URI:", mongoURI ? "Found" : "Not found");

// References to models - will be loaded after connection
let User, City;

async function linkUsersToCities() {
  console.log("Connecting to database...");
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Now that we're connected, get model references
    User = mongoose.model('user');
    City = mongoose.model('Wilaya');
    
    console.log("Database connection successful!");
    
    // Check if city field exists in user schema and add it if needed
    await ensureCityFieldsExist();
    
    // Simplified diagnostic focused specifically on the string format observed in MongoDB Atlas
    console.log("Analyzing location data based on actual MongoDB format...");
    console.log("Expected format: location as string 'latitude, longitude'");
    
    // Check how many users have location data as a string
    const usersWithLocation = await User.countDocuments({ 
      location: { $exists: true } 
    });
    
    const usersWithStringLocation = await User.countDocuments({ 
      location: { $type: "string" } 
    });
    
    console.log(`Users with location field: ${usersWithLocation}`);
    console.log(`Users with string location: ${usersWithStringLocation}`);
    
    // Get first user in the database to see an actual example
    const firstUser = await User.findOne({location: {$exists: true}}).lean();
    if (firstUser) {
      console.log("\nFound user example with location data:");
      console.log(`User ID: ${firstUser._id}`);
      console.log(`Location raw value: ${JSON.stringify(firstUser.location)}`);
      
      // Try to parse the location right away
      if (typeof firstUser.location === 'string') {
        try {
          // Best practice for the specific format we observed
          const [lat, lng] = firstUser.location.split(',').map(coord => parseFloat(coord.trim()));
          console.log(`Parsed location: latitude=${lat}, longitude=${lng}`);
          console.log(`Location format confirmed as "latitude, longitude" string`);
        } catch(err) {
          console.log(`Error parsing location: ${err.message}`);
        }
      }
    }
    
    // Get sample user with string location data
    const sampleUser = await User.findOne({
      location: { $type: "string" }
    }).lean();
    
    if (sampleUser) {
      console.log("\nSample user with string location data:");
      console.log(`User ID: ${sampleUser._id}`);
      console.log(`Location (raw): "${sampleUser.location}"`);
      
      // Try to parse the string location with more robust parsing
      if (typeof sampleUser.location === 'string') {
        // Try multiple parsing strategies
        try {
          // Strategy 1: Simple split by comma
          let lat, lng;
          if (sampleUser.location.includes(',')) {
            [lat, lng] = sampleUser.location.split(',').map(coord => parseFloat(coord.trim()));
            console.log(`Parsed coordinates (split): [latitude=${lat}, longitude=${lng}]`);
          } 
          // Strategy 2: Regular expression to extract numbers
          else {
            const coordMatches = sampleUser.location.match(/-?\d+\.\d+/g);
            if (coordMatches && coordMatches.length >= 2) {
              lat = parseFloat(coordMatches[0]);
              lng = parseFloat(coordMatches[1]);
              console.log(`Parsed coordinates (regex): [latitude=${lat}, longitude=${lng}]`);
            }
          }
          
          // Additional validation
          if (lat !== undefined && lng !== undefined) {
            if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
              console.log("⚠️ Warning: Coordinates appear to be out of valid range");
            }
          }
        } catch (err) {
          console.log(`Error parsing location: ${err.message}`);
        }
      }
    } else {
      console.log("\nNo users found with string location data");
      
      // Try to find any users with location data in any format
      const anyLocation = await User.findOne({ location: { $exists: true } }).lean();
      if (anyLocation) {
        console.log("Found a user with location in different format:");
        console.log(`User ID: ${anyLocation._id}`);
        console.log(`Location type: ${typeof anyLocation.location}`);
        console.log(`Location value:`, anyLocation.location);
      } else {
        console.log("No users found with any location data");
      }
    }
    
    // Verify city/Wilaya data has proper geospatial index
    console.log("\nChecking City/Wilaya collection for geospatial index...");
    const cityIndexes = await City.collection.indexes();
    const hasGeoIndex = cityIndexes.some(index => 
      index.key && index.key.location === '2dsphere'
    );
    
    if (!hasGeoIndex) {
      console.warn("⚠️ WARNING: No geospatial index found on City/Wilaya collection!");
      console.log("Creating geospatial index on location field...");
      try {
        await City.collection.createIndex({ "location": "2dsphere" });
        console.log("✅ Successfully created geospatial index.");
      } catch (indexErr) {
        console.error("❌ Failed to create index:", indexErr.message);
      }
    } else {
      console.log("✅ Geospatial index found on City/Wilaya collection.");
    }
    
    // 1. First get all cities and create a lookup map
    console.log("Fetching all cities...");
    const cities = await City.find({});
    console.log(`Found ${cities.length} cities`);
    
    if (cities.length === 0) {
      console.error("No cities found! Make sure to seed your cities data first.");
      return process.exit(1);
    }
    
    const cityMap = createCityMap(cities);
    
    // Simplified user processing focusing only on the specific location format
    console.log("\nProcessing users with location.coordinates format...");
    
    const BATCH_SIZE = 100;
    let processedCount = 0;
    let updatedCount = 0;
    let hasMore = true;
    let lastId = null;
    
    while (hasMore) {
      // Query users with any format of location data that needs cityId
      let query = { 
        $or: [
          { cityId: null },
          { cityId: { $exists: false } }
        ],
        location: { $exists: true }
      };
      
      if (lastId) {
        query._id = { $gt: lastId };
      }
      
      // Get batch of users
      const users = await User.find(query).limit(BATCH_SIZE).sort({ _id: 1 });
      
      if (users.length === 0) {
        hasMore = false;
        break;
      }
      
      console.log(`Processing batch of ${users.length} users with coordinates...`);
      
      for (const user of users) {
        const updated = await linkUserToCityByCoordinates(user, cities);
        if (updated) updatedCount++;
        processedCount++;
        lastId = user._id;
      }
      
      console.log(`Progress: ${processedCount} users processed, ${updatedCount} users updated`);
    }
    
    console.log("=== SUMMARY ===");
    console.log(`Total users with coordinates processed: ${processedCount}`);
    console.log(`Total users updated with city references: ${updatedCount}`);
    console.log("Script completed successfully!");
  } catch (error) {
    console.error("Error during script execution:", error);
  } finally {
    // Close connection
    await mongoose.disconnect();
    console.log("Database connection closed");
  }
}

// Helper function to create a map of cities by name and code
function createCityMap(cities) {
  const cityMap = {
    byName: {},
    byCode: {},
    byNameLower: {},
    byWilayaCode: {}
  };
  
  cities.forEach(city => {
    // Map by ID
    cityMap[city._id.toString()] = city;
    
    // Map by name (case sensitive and case insensitive)
    cityMap.byName[city.name] = city;
    cityMap.byNameLower[city.name.toLowerCase()] = city;
    
    // Map by code if available
    if (city.code) {
      cityMap.byCode[city.code.toString()] = city;
      cityMap.byWilayaCode[city.code.toString()] = city;
    }
  });
  
  return cityMap;
}

// Optimized function to handle multiple location data formats
async function linkUserToCityByCoordinates(user, allCities) {
  try {
    // Check if location exists
    if (!user.location) {
      console.log(`User ${user._id} has no location`);
      return false;
    }
    
    // Direct approach to extract coordinates - simplify everything
    let latitude = null;
    let longitude = null;

    // Force to string and extract coordinates directly
    const locationStr = String(user.location);
    
    // Simple string parsing based on comma
    if (locationStr.includes(',')) {
      const parts = locationStr.split(',');
      if (parts.length >= 2) {
        latitude = parseFloat(parts[0].trim());
        longitude = parseFloat(parts[1].trim());
        console.log(`Extracted coordinates: [${latitude}, ${longitude}]`);
      }
    }
    
    // Final validation of extracted coordinates
    if (latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
      console.log(`User ${user._id}: Failed to extract coordinates from ${locationStr}`);
      return false;
    }
    
    // Proceed with city lookup using the extracted coordinates
    return processCityLookup(user, latitude, longitude, allCities);
    
  } catch (error) {
    console.error(`Error processing user ${user._id} location:`, error);
    return false;
  }
}

// Separate function to handle city lookup once we have valid coordinates
async function processCityLookup(user, latitude, longitude, allCities) {
  try {
    // Log coordinates being used for lookup
    console.log(`Looking for city near [${latitude}, ${longitude}] for user ${user._id}`);
    
    // First check if coordinates look valid for Algeria (approximate bounds)
    const isValidAlgerianCoordinate = 
      latitude >= 18 && latitude <= 38 && // Algeria latitude range
      longitude >= -10 && longitude <= 12; // Algeria longitude range
    
    if (!isValidAlgerianCoordinate) {
      console.log(`⚠️ User ${user._id} has coordinates outside Algeria's expected range`);
      // Continue anyway but with a warning
    }
    
    // Try to find the nearest city using geospatial query
    const nearestCity = await City.findOne({
      'location': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]  // GeoJSON order: [longitude, latitude]
          },
          $maxDistance: 50000 // Keep 50km as logical radius
        }
      }
    });
    
    if (nearestCity) {
      if (!nearestCity.code) {
        console.log(`⚠️ City ${nearestCity._id} (${nearestCity.name}) has no code, skipping user ${user._id}`);
        return false;
      }
      
      // Update user with city code
      await User.findByIdAndUpdate(
        user._id, 
        { 
          $unset: { city: "" },
          $set: {
            cityId: nearestCity.code.toString(),
            lastCityUpdate: new Date()
          }
        }
      );
      
      console.log(`✅ Updated user ${user._id} with city: ${nearestCity.name} (code: ${nearestCity.code})`);
      return true;
    } else {
      console.log(`No city found within 50km of user ${user._id}'s location`);
      
      // Check if any cities have valid coordinates
      const citiesWithCoords = allCities.filter(city => 
        city.location && 
        city.location.coordinates && 
        Array.isArray(city.location.coordinates) && 
        city.location.coordinates.length === 2
      );
      
      if (citiesWithCoords.length === 0) {
        console.log(`❌ ERROR: No cities have valid coordinates in the database!`);
        return false;
      }
      
      // Display some diagnostic info
      console.log(`Found ${citiesWithCoords.length} cities with coordinates in the database`);
      const sampleCity = citiesWithCoords[0];
      console.log(`Sample city coordinates: [${sampleCity.location.coordinates[1]}, ${sampleCity.location.coordinates[0]}]`);
      
      // Don't assign any city if none is within range - this is more logical
      console.log(`Leaving user ${user._id} without a city assignment as no city is within range`);
      return false;
    }
  } catch (err) {
    console.error(`Error during city lookup for user ${user._id}:`, err.message);
    return false;
  }
}

// MODIFIED: Only check for cityId field, remove city field
async function ensureCityFieldsExist() {
  try {
    console.log("Checking User schema for city fields...");
    
    // Get sample user to check schema
    const sampleUser = await User.findOne({}).lean();
    
    if (!sampleUser) {
      console.log("No users found to check schema.");
      return;
    }
    
    console.log("Examining user schema...");
    
    // Check if city field exists and needs to be removed
    let needsSchemaUpdate = false;
    let updateOperations = {};
    let hasRemoveOperations = false;
    
    if (Object.prototype.hasOwnProperty.call(sampleUser, 'city')) {
      console.log("⚠️ User schema has 'city' field that needs to be removed.");
      hasRemoveOperations = true;
    }
    
    if (!Object.prototype.hasOwnProperty.call(sampleUser, 'cityId')) {
      console.log("⚠️ User schema is missing 'cityId' field. Will add it.");
      updateOperations.cityId = null;
      needsSchemaUpdate = true;
    } else {
      console.log("✅ User schema already has 'cityId' field.");
    }
    
    // If we need to add cityId field
    if (needsSchemaUpdate) {
      console.log("Updating user schema with missing fields...");
      
      // Update all users to add the missing fields
      const updateResult = await User.updateMany(
        { }, // match all documents
        { $set: updateOperations },
        { multi: true }
      );
      
      console.log(`✅ Schema update complete. Modified ${updateResult.modifiedCount} users.`);
    }
    
    // If we need to remove city field
    if (hasRemoveOperations) {
      console.log("Removing 'city' field from all users...");
      
      // Update all users to remove the city field
      const removeResult = await User.updateMany(
        { }, // match all documents
        { $unset: { city: "" } },
        { multi: true }
      );
      
      console.log(`✅ Removed 'city' field from ${removeResult.modifiedCount} users.`);
    }
    
    return needsSchemaUpdate || hasRemoveOperations;
  } catch (error) {
    console.error("Error checking/updating user schema:", error);
    throw error; // Propagate error up
  }
}

// Run the script when executed directly
if (require.main === module) {
  console.log("Starting city linking process...");
  linkUsersToCities().then(() => {
    console.log("Script execution complete");
  }).catch(err => {
    console.error("Script error:", err);
    process.exit(1);
  });
}

// Export for programmatic usage
module.exports = { linkUsersToCities };
