const { Router } = require('express');
const donationController = require('../controllers/donationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = Router();

// Protected routes (require auth)
router.post('/', authMiddleware, donationController.createDonation);
router.get('/user', authMiddleware, donationController.getUserDonations);
router.get('/:donationId', authMiddleware, donationController.getDonationById);
router.patch('/:donationId/status', authMiddleware, donationController.updateDonationStatus);

module.exports = router;
