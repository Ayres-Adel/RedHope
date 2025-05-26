const { Router } = require('express');
const router = Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');


router.post('/login', authController.login);


router.post('/register', authController.register);


router.post('/signup', authController.register);


router.get('/logout', authController.logout);


router.post('/refresh-token', authController.refreshToken);


router.get('/nearby', authMiddleware, authController.nearby_get);


router.get('/public/nearby', authController.public_nearby_get);

module.exports = router;
