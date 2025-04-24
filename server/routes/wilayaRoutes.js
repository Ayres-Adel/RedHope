const { Router } = require('express');
const router = Router();

// Get all wilayas
router.get('/', async (req, res) => {
  try {
    // Mock wilayas data
    const wilayas = [
      { id: 1, name: 'Adrar', code: '01' },
      { id: 2, name: 'Chlef', code: '02' },
      { id: 3, name: 'Laghouat', code: '03' },
      { id: 4, name: 'Oum El Bouaghi', code: '04' },
      { id: 5, name: 'Batna', code: '05' },
      { id: 6, name: 'Béjaïa', code: '06' },
      { id: 7, name: 'Biskra', code: '07' },
      { id: 8, name: 'Béchar', code: '08' },
      { id: 9, name: 'Blida', code: '09' },
      { id: 10, name: 'Bouira', code: '10' }
    ];
    
    res.json(wilayas);
  } catch (err) {
    console.error('Error fetching wilayas:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
