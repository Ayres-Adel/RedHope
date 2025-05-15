const { Router } = require('express');
const donationRequestController = require('../controllers/donationRequestController');
const authMiddleware = require('../middleware/authMiddleware');

const router = Router();

// Public route for guests to create donation requests (no auth required)
router.post('/guest', donationRequestController.createGuestDonationRequest);

// Protected routes (require auth)
router.post('/', authMiddleware, donationRequestController.createDonationRequest);
router.get('/', authMiddleware, donationRequestController.getDonationRequests);
router.get('/user', authMiddleware, donationRequestController.getUserDonationRequests);
router.get('/:requestId', authMiddleware, donationRequestController.getDonationRequestById);
router.patch('/:requestId/status', authMiddleware, donationRequestController.updateDonationRequestStatus);

module.exports = router;
