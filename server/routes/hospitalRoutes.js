const { Router } = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const hospitalController = require('../controllers/hospitalController');

const router = Router();

// Get all hospitals
router.get('/', async (req, res) => {
  try {
    // Mock hospitals data
    const hospitals = Array.from({ length: 10 }, (_, i) => ({
      _id: `hospital_${i+1}`,
      name: `Hospital ${i+1}`,
      location: `Location ${i+1}`,
      contactNumber: `+213${555000 + i}`,
      email: `hospital${i+1}@example.com`,
      bloodAvailability: {
        'A+': ['High', 'Medium', 'Low', 'Critical'][i % 4],
        'B+': ['High', 'Medium', 'Low', 'Critical'][i % 4],
        'AB+': ['High', 'Medium', 'Low', 'Critical'][i % 4],
        'O+': ['High', 'Medium', 'Low', 'Critical'][i % 4]
      }
    }));
    
    res.json(hospitals);
  } catch (err) {
    console.error('Error fetching hospitals:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get hospitals by wilaya
router.get('/wilaya/:wilaya', hospitalController.getHospitalsByWilaya);

// Get hospitals near a location
router.get('/nearby', hospitalController.getHospitalsNearby);

module.exports = router;
