// routes/userRoutes.js
const { Router } = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = Router();

// Protected routes (require auth)
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/change-password', authMiddleware, userController.changePassword);
router.delete('/delete-account', authMiddleware, userController.deleteAccount);

module.exports = router;