// routes/authRoutes.js
const { Router } = require('express');
const router = Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Login route
router.post('/login', authController.login);

// Register route
router.post('/register', authController.register);

// Add an alias route for /signup that points to the register function
router.post('/signup', authController.register);

// Logout route
router.get('/logout', authController.logout);

// Refresh token route
router.post('/refresh-token', authController.refreshToken);

// Add nearby donors route
router.get('/nearby', authMiddleware, authController.nearby_get);

// Fix public nearby donors route - remove redundant /api prefix
router.get('/public/nearby', authController.public_nearby_get);

module.exports = router;
