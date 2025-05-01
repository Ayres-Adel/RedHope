// routes/authRoutes.js
const { Router } = require('express');
const router = Router();
const authController = require('../controllers/authController');

// Add debugging middleware
router.use((req, res, next) => {
  console.log(`Auth API request: ${req.method} ${req.originalUrl}`);
  next();
});

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

module.exports = router;
