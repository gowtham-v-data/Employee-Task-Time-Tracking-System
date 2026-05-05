import { Notification, User } from '../models/index.js';
import { Op } from 'sequelize';

// Get notifications for current user
export const getNotifications = async (req, res, next) => {
  try {
    const {
      is_read,
      page = 1,
      limit = 50
    } = req.query;

    const where = { user_id: req.user.id };
    const offset = (page - 1) * limit;

    if (is_read !== undefined) {
      where.is_read = is_read === 'true';
    }

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    // Count unread
    const unreadCount = await Notification.count({
      where: {
        user_id: req.user.id,
        is_read: false
      }
    });

    res.json({
      success: true,
      data: {
        notifications,
        unread_count: unreadCount,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: {
        id,
        user_id: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.is_read = true;
    notification.read_at = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.update(
      {
        is_read: true,
        read_at: new Date()
      },
      {
        where: {
          user_id: req.user.id,
          is_read: false
        }
      }
    );

    res.json({
      success: true,
      message: `${result[0]} notifications marked as read`
    });
  } catch (error) {
    next(error);
  }
};

// Delete notification
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await Notification.destroy({
      where: {
        id,
        user_id: req.user.id
      }
    });

    if (result === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
};

// Create notification (internal use)
export const createNotification = async (userId, type, title, message, relatedId = null) => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      type,
      title,
      message,
      related_id: relatedId
    });
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

// Get unread count
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.count({
      where: {
        user_id: req.user.id,
        is_read: false
      }
    });

    res.json({
      success: true,
      data: { unread_count: count }
    });
  } catch (error) {
    next(error);
  }
};
