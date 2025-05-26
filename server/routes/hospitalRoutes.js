const { Router } = require('express');

const authMiddleware = require('../middleware/authMiddleware');
const requireAuth = authMiddleware.requireAuth || authMiddleware;
const hospitalController = require('../controllers/hospitalController');
const Hospital = require('../models/Hospital'); 

const router = Router();


router.get('/', async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sort = req.query.sort || 'name';
    const order = req.query.order === 'desc' ? -1 : 1;
    

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { wilaya: { $regex: search, $options: 'i' } },
        { structure: { $regex: search, $options: 'i' } }
      ];
    }

    const totalItems = await Hospital.countDocuments(query);
    

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
    console.error('Error fetching hospitals from database:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: err.message 
    });
  }
});


router.get('/wilaya/:wilaya', hospitalController.getHospitalsByWilaya);


router.get('/nearby', hospitalController.getHospitalsNearby);


router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    

    const hospital = await Hospital.findById(id).lean();
    
    if (!hospital) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hospital not found' 
      });
    }
    
    res.json({ success: true, hospital });
  } catch (err) {
    console.error(`Error fetching hospital ${req.params.id}:`, err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


router.post('/', requireAuth, async (req, res) => {
  try {

    const newHospital = new Hospital(req.body);
    

    const savedHospital = await newHospital.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Hospital created successfully',
      hospital: savedHospital 
    });
  } catch (err) {
    console.error('Error creating hospital:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating hospital', 
      error: err.message 
    });
  }
});


router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    

    const updatedHospital = await Hospital.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!updatedHospital) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hospital not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Hospital updated successfully',
      hospital: updatedHospital
    });
  } catch (err) {
    console.error(`Error updating hospital ${req.params.id}:`, err);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating hospital', 
      error: err.message 
    });
  }
});


router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    

    const deletedHospital = await Hospital.findByIdAndDelete(id);
    
    if (!deletedHospital) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hospital not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: `Hospital deleted successfully`,
      hospital: deletedHospital
    });
  } catch (err) {
    console.error(`Error deleting hospital ${req.params.id}:`, err);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting hospital', 
      error: err.message 
    });
  }
});


router.get('/export', requireAuth, async (req, res) => {
  try {

    const csvContent = "id,name,structure,wilaya,telephone,fax\n" +
      "hospital_1,Hospital 1,Structure 1,Algiers,+21355500001,+21366600001\n" +
      "hospital_2,Hospital 2,Structure 2,Oran,+21355500002,+21366600002";
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=hospitals.csv');
    res.status(200).send(csvContent);
  } catch (err) {
    console.error('Error exporting hospital data:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


router.post('/seed', async (req, res) => {
  await hospitalController.seedHospitals(req, res);
});


router.post('/some-endpoint', (req, res) => {
  try {

    res.status(200).json({
      success: true,
      message: 'Endpoint under construction',
      data: null
    });
  } catch (err) {
    console.error('Error in /some-endpoint:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'An error occurred processing your request'
    });
  }
});


router.post('/some-route', async (req, res) => {
  try {

    const data = req.body;
    

    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'Missing required data'
      });
    }
    

    res.status(200).json({
      success: true,
      message: 'Operation completed successfully',
      data: {}
    });
  } catch (error) {
    console.error('Error in hospital route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
