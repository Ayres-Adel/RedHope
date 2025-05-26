const { Router } = require('express');
const router = Router();
const statsController = require('../controllers/statsController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');


router.use((req, res, next) => {
  next();
});


const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error(`API Error: ${error.message}`);
    return res.status(500).json({ 
      success: false, 
      message: "An error occurred while processing your request",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      data: { empty: true } 
    });
  });
};

router.get('/user/stats', authMiddleware, asyncHandler(statsController.getUserStats));
router.get('/user/all', authMiddleware, asyncHandler(statsController.getUserStats));


router.get('/donations/stats', authMiddleware, asyncHandler(statsController.getDonationStats));

router.get('/donations/list', authMiddleware, asyncHandler(statsController.getDonationsList));
router.get('/blood-supply', asyncHandler(statsController.getBloodSupply));


router.get('/donations/*', authMiddleware, (req, res) => {
  return res.status(200).json({ 
    success: true, 
    message: "No donations data found for this endpoint",
    data: { 
      donations: [], 
      total: 0, 
      empty: true,
      requestPath: req.path
    } 
  });
});


router.get('/blood-types', asyncHandler(statsController.getBloodTypeStats));


router.get('/update-user-cities', authMiddleware, asyncHandler(statsController.updateUserCities));

module.exports = router;