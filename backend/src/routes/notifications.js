import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { query } from 'express-validator';
import { validate } from '../middleware/validator.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(authenticate);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Get notifications
router.get('/',
  [
    query('is_read').optional().isBoolean(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  getNotifications
);

// Mark notification as read
router.put('/:id/read', markAsRead);

// Mark all as read
router.put('/read-all', markAllAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

export default router;
