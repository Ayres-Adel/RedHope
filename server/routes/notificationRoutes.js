const { Router } = require('express');
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = Router();

// Protected routes (require auth)
router.get('/', authMiddleware, notificationController.getUserNotifications);
router.post('/read', authMiddleware, notificationController.markAsRead);
router.post('/archive', authMiddleware, notificationController.archiveNotifications);
router.get('/unread-count', authMiddleware, notificationController.getUnreadCount);

module.exports = router;
