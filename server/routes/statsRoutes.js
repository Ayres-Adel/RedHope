const { Router } = require('express');
const router = Router();
const statsController = require('../controllers/statsController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Add error handling middleware
router.use((req, res, next) => {
  console.log(`Stats API request: ${req.method} ${req.originalUrl}`);
  next();
});

// Add error handling wrapper function
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error(`API Error: ${error.message}`);
    return res.status(500).json({ 
      success: false, 
      message: "An error occurred while processing your request",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      data: { empty: true } // Always return data object with empty flag to prevent UI errors
    });
  });
};

router.get('/user/stats', authMiddleware, asyncHandler(statsController.getUserStats));
router.get('/user/all', authMiddleware, asyncHandler(statsController.getUserStats));

// Fix donations endpoints with better error handling
router.get('/donations/stats', authMiddleware, asyncHandler(statsController.getDonationStats));
router.get('/donations', authMiddleware, asyncHandler(statsController.getDonationStats));
router.get('/blood-supply', asyncHandler(statsController.getBloodSupply));

// Add a fallback route for donations to prevent 404 errors
router.get('/donations/*', authMiddleware, (req, res) => {
  return res.status(200).json({ 
    success: true, 
    message: "No donations data found",
    data: { donations: [], total: 0, empty: true } 
  });
});

// Add blood type distribution stats endpoint (separate from blood-supply used by admin)
router.get('/blood-types', asyncHandler(statsController.getBloodTypeStats));

// Add a route to update user cities based on coordinates
router.get('/update-user-cities', authMiddleware, asyncHandler(statsController.updateUserCities));

module.exports = router;