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
router.get('/donor', authMiddleware, donationRequestController.getUserDonorRequests);
router.get('/all-user', authMiddleware, donationRequestController.getAllUserRequests);
router.get('/:requestId', authMiddleware, donationRequestController.getDonationRequestById);
router.patch('/:requestId/status', authMiddleware, donationRequestController.updateDonationRequestStatus);

// Replace temporary implementations with proper controller methods
router.put('/:requestId/cancel', authMiddleware, donationRequestController.cancelDonationRequest);
router.put('/:requestId/update', authMiddleware, donationRequestController.updateDonationRequest);
router.put('/:requestId/complete', authMiddleware, donationRequestController.completeDonationRequest);
router.put('/:requestId/fulfill', authMiddleware, donationRequestController.fulfillDonationRequest);
router.delete('/:requestId', authMiddleware, donationRequestController.deleteDonationRequest);

module.exports = router;
