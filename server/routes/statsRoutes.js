const { Router } = require('express');
const router = Router();
const statsController = require('../controllers/statsController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Remove adminMiddleware for now to eliminate potential errors
// Add debugging middleware to log requests
router.use((req, res, next) => {
  console.log(`Stats API request: ${req.method} ${req.originalUrl}`);
  next();
});

router.get('/user/stats', authMiddleware, statsController.getUserStats);
router.get('/user/all', authMiddleware, statsController.getUserStats);  // Add alias for /user/all
router.get('/donations/stats', authMiddleware, statsController.getDonationStats);
router.get('/donations', authMiddleware, statsController.getDonationStats);  // Add alias for /donations
router.get('/blood-supply', statsController.getBloodSupply);

module.exports = router;