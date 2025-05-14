const { Router } = require('express');
const router = Router();
const mongoose = require('mongoose');

// Add error handling wrapper function
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error(`API Error: ${error.message}`);
    return res.status(500).json({ 
      success: false, 
      message: "An error occurred while processing your request",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  });
};

// Define a simple schema for wilaya if not already defined elsewhere
let Wilaya;
try {
  Wilaya = mongoose.model('Wilaya');
} catch (e) {
  const wilayaSchema = new mongoose.Schema({
    code: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    population: { type: Number },
    arName: { type: String }
  });
  
  wilayaSchema.index({ location: '2dsphere' });
  Wilaya = mongoose.model('Wilaya', wilayaSchema);
}

// Get all wilayas
router.get('/all', asyncHandler(async (req, res) => {
  const wilayas = await Wilaya.find().sort({ name: 1 }).lean();
  
  return res.status(200).json({
    success: true,
    count: wilayas.length,
    data: wilayas
  });
}));

// Get a specific wilaya by id
router.get('/:id', asyncHandler(async (req, res) => {
  const wilaya = await Wilaya.findById(req.params.id).lean();
  
  if (!wilaya) {
    return res.status(404).json({
      success: false,
      message: `Wilaya with id ${req.params.id} not found`
    });
  }
  
  return res.status(200).json({
    success: true,
    data: wilaya
  });
}));

// In case we have no wilayas in the database, let's provide a way to create some
router.post('/seed', asyncHandler(async (req, res) => {
  const algeriaCities = [
    { code: 1, name: "Adrar", arName: "أدرار", location: { coordinates: [0.1626, 27.8742] }, population: 64781 },
    { code: 16, name: "Algiers", arName: "الجزائر العاصمة", location: { coordinates: [3.0588, 36.7538] }, population: 2365000 },
    { code: 31, name: "Oran", arName: "وهران", location: { coordinates: [-0.6492, 35.6969] }, population: 803329 },
    { code: 9, name: "Blida", arName: "البليدة", location: { coordinates: [2.8274, 36.4722] }, population: 330000 },
    { code: 31, name: "Constantine", arName: "قسنطينة", location: { coordinates: [6.5850, 36.3650] }, population: 448374 },
    { code: 13, name: "Tlemcen", arName: "تلمسان", location: { coordinates: [-1.3167, 34.8828] }, population: 140158 },
    { code: 19, name: "Setif", arName: "سطيف", location: { coordinates: [5.4130, 36.1898] }, population: 288461 },
    { code: 22, name: "Annaba", arName: "عنابة", location: { coordinates: [7.7667, 36.9000] }, population: 257359 },
    { code: 31, name: "Batna", arName: "باتنة", location: { coordinates: [6.1739, 35.5500] }, population: 289504 }
  ];
  
  const count = await Wilaya.countDocuments();
  
  if (count > 0) {
    return res.status(200).json({
      success: true,
      message: `Wilayas already seeded. Database has ${count} wilayas.`
    });
  }
  
  await Wilaya.insertMany(algeriaCities);
  
  return res.status(201).json({
    success: true,
    message: `Successfully seeded ${algeriaCities.length} wilayas`,
    data: algeriaCities
  });
}));

module.exports = router;
