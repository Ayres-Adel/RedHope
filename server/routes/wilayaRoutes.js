const { Router } = require('express');
const router = Router();
const mongoose = require('mongoose');


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
        type: [Number], 
        required: true
      }
    },
    population: { type: Number },
    arName: { type: String }
  });
  
  wilayaSchema.index({ location: '2dsphere' });
  Wilaya = mongoose.model('Wilaya', wilayaSchema);
}


router.get('/all', asyncHandler(async (req, res) => {
  const wilayas = await Wilaya.find().sort({ code: 1 });
  res.json(wilayas);
}));


router.get('/code/:code', asyncHandler(async (req, res) => {
  const wilaya = await Wilaya.findOne({ code: req.params.code });
  if (!wilaya) {
    return res.status(404).json({ success: false, message: 'Wilaya not found' });
  }
  res.json(wilaya);
}));


router.get('/:id', asyncHandler(async (req, res) => {
  const wilaya = await Wilaya.findById(req.params.id);
  if (!wilaya) {
    return res.status(404).json({ success: false, message: 'Wilaya not found' });
  }
  res.json(wilaya);
}));


router.post('/seed', asyncHandler(async (req, res) => {

  const count = await Wilaya.countDocuments();
  if (count > 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Wilayas already seeded',
      count: count 
    });
  }


  const wilayasToCreate = [
    { code: "01", name: "Adrar", latitude: 27.87, longitude: -0.28 },
    { code: "02", name: "Chlef", latitude: 36.15, longitude: 1.31 },
    { code: "03", name: "Laghouat", latitude: 33.80, longitude: 2.86 },
    { code: "04", name: "Oum El Bouaghi", latitude: 35.87, longitude: 7.11 },
    { code: "05", name: "Batna", latitude: 35.54, longitude: 6.12 },
    { code: "06", name: "Béjaïa", latitude: 36.75, longitude: 5.05 },
    { code: "07", name: "Biskra", latitude: 34.85, longitude: 5.74 },
    { code: "08", name: "Béchar", latitude: 31.60, longitude: -2.24 },
    { code: "09", name: "Blida", latitude: 36.48, longitude: 2.80 },
    { code: "10", name: "Bouira", latitude: 36.37, longitude: 3.88 },
    { code: "11", name: "Tamanrasset", latitude: 22.77, longitude: 5.53 },
    { code: "12", name: "Tébessa", latitude: 35.40, longitude: 8.10 },
    { code: "13", name: "Tlemcen", latitude: 34.88, longitude: -1.33 },
    { code: "14", name: "Tiaret", latitude: 35.38, longitude: 1.31 },
    { code: "15", name: "Tizi Ouzou", latitude: 36.71, longitude: 4.03 },
    { code: "16", name: "Alger", latitude: 36.75, longitude: 3.05 },
    { code: "17", name: "Djelfa", latitude: 34.66, longitude: 3.07 },
    { code: "18", name: "Jijel", latitude: 36.80, longitude: 5.80 },
    { code: "19", name: "Sétif", latitude: 36.19, longitude: 5.40 },
    { code: "20", name: "Saïda", latitude: 34.83, longitude: 0.15 },
    { code: "21", name: "Skikda", latitude: 36.41, longitude: 3.69 },
    { code: "22", name: "Sidi Bel Abbès", latitude: 35.18, longitude: -0.65 },
    { code: "23", name: "Annaba", latitude: 36.91, longitude: 7.73 },
    { code: "24", name: "Guelma", latitude: 36.46, longitude: 7.43 },
    { code: "25", name: "Constantine", latitude: 36.37, longitude: 6.62 },
    { code: "26", name: "Médéa", latitude: 36.26, longitude: 2.76 },
    { code: "27", name: "Mostaganem", latitude: 35.93, longitude: 0.09 },
    { code: "28", name: "M'Sila", latitude: 35.71, longitude: 4.51 },
    { code: "29", name: "Mascara", latitude: 35.40, longitude: 0.14 },
    { code: "30", name: "Ouargla", latitude: 31.96, longitude: 5.05 },
    { code: "31", name: "Oran", latitude: 35.70, longitude: -0.63 },
    { code: "32", name: "El Bayadh", latitude: 33.67, longitude: 1.01 },
    { code: "33", name: "Illizi", latitude: 26.41, longitude: 3.59 },
    { code: "34", name: "Bordj Bou Arréridj", latitude: 36.06, longitude: 4.77 },
    { code: "35", name: "Boumerdès", latitude: 36.75, longitude: 3.44 },
    { code: "36", name: "El Tarf", latitude: 36.76, longitude: 8.32 },
    { code: "37", name: "Tindouf", latitude: 27.68, longitude: -8.14 },
    { code: "38", name: "Tissemsilt", latitude: 35.60, longitude: 1.82 },
    { code: "39", name: "El Oued", latitude: 33.39, longitude: 6.87 },
    { code: "40", name: "Khenchela", latitude: 35.45, longitude: 7.12 },
    { code: "41", name: "Souk Ahras", latitude: 36.28, longitude: 7.93 },
    { code: "42", name: "Tipaza", latitude: 36.59, longitude: 2.44 },
    { code: "43", name: "Mila", latitude: 36.44, longitude: 6.26 },
    { code: "44", name: "Aïn Defla", latitude: 36.26, longitude: 1.96 },
    { code: "45", name: "Naâma", latitude: 33.53, longitude: -0.28 },
    { code: "46", name: "Aïn Témouchent", latitude: 35.31, longitude: -1.10 },
    { code: "47", name: "Ghardaïa", latitude: 32.49, longitude: 3.69 },
    { code: "48", name: "Relizane", latitude: 35.73, longitude: 0.55 },
    { code: "49", name: "El M'ghair", latitude: 33.95, longitude: 5.91 },
    { code: "50", name: "El Meniaa", latitude: 30.60, longitude: 1.76 },
    { code: "51", name: "Ouled Djellal", latitude: 34.43, longitude: 5.06 },
    { code: "52", name: "Bordj Badji Mokhtar", latitude: 21.68, longitude: 0.95 },
    { code: "53", name: "Béni Abbès", latitude: 30.13, longitude: -2.17 },
    { code: "54", name: "Timimoun", latitude: 29.26, longitude: 0.23 },
    { code: "55", name: "Touggourt", latitude: 33.10, longitude: 6.06 },
    { code: "56", name: "Djanet", latitude: 24.48, longitude: 9.51 },
    { code: "57", name: "In Salah", latitude: 27.20, longitude: 0.73 },
    { code: "58", name: "In Guezzam", latitude: 19.57, longitude: 5.77 }
  ];

  await Wilaya.insertMany(wilayasToCreate);

  res.json({ 
    success: true, 
    message: 'Wilayas seeded successfully',
    count: wilayasToCreate.length 
  });
}));

module.exports = router;
