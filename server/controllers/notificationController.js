const Notification = require('../models/Notification');

module.exports = {
  // Get user's notifications
  getUserNotifications: async (req, res) => {
    try {
      const notifications = await Notification.find({ 
        recipient: req.user.userId,
        isArchived: false 
      })
      .sort({ createdAt: -1 })
      .limit(50);
      
      res.json(notifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },
  
  // Mark notifications as read
  markAsRead: async (req, res) => {
    try {
      const { notificationIds } = req.body;
      
      // Validate that notificationIds is an array
      if (!Array.isArray(notificationIds)) {
        return res.status(400).json({ error: 'notificationIds must be an array' });
      }
      
      // Update each notification that belongs to the current user
      await Notification.updateMany({
        _id: { $in: notificationIds },
        recipient: req.user.userId
      }, {
        $set: { isRead: true }
      });
      
      res.json({ success: true });
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },
  
  // Archive notifications
  archiveNotifications: async (req, res) => {
    try {
      const { notificationIds } = req.body;
      
      // Validate that notificationIds is an array
      if (!Array.isArray(notificationIds)) {
        return res.status(400).json({ error: 'notificationIds must be an array' });
      }
      
      // Archive each notification that belongs to the current user
      await Notification.updateMany({
        _id: { $in: notificationIds },
        recipient: req.user.userId
      }, {
        $set: { isArchived: true }
      });
      
      res.json({ success: true });
    } catch (err) {
      console.error('Error archiving notifications:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },
  
  // Get unread notification count
  getUnreadCount: async (req, res) => {
    try {
      const count = await Notification.countDocuments({
        recipient: req.user.userId,
        isRead: false,
        isArchived: false
      });
      
      res.json({ count });
    } catch (err) {
      console.error('Error getting unread count:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
};
