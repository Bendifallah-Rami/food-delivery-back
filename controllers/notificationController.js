const { Notification, User } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

// Security middleware for notification access
const checkNotificationAccess = async (notificationId, userId, userRole) => {
  const notification = await Notification.findByPk(notificationId);
  
  if (!notification) {
    return { allowed: false, error: 'Notification not found' };
  }

  // Admin can access all notifications
  if (userRole === 'admin') {
    return { allowed: true, notification };
  }

  // Users can only access their own notifications
  if (notification.userId !== userId) {
    return { allowed: false, error: 'Access denied to this notification' };
  }

  return { allowed: true, notification };
};

// Get notifications for current user
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, isRead, priority } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let whereClause = {};

    // If not admin, only show user's notifications
    if (userRole !== 'admin') {
      whereClause.userId = userId;
    }

    // Apply filters
    if (type) whereClause.type = type;
    if (isRead !== undefined) whereClause.isRead = isRead === 'true';
    if (priority) whereClause.priority = priority;

    // Remove expired notifications
    whereClause[Op.or] = [
      { expiresAt: null },
      { expiresAt: { [Op.gt]: new Date() } }
    ];

    const offset = (page - 1) * limit;

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        }
      ],
      order: [
        ['priority', 'DESC'], // Urgent first
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        },
        unreadCount: await Notification.count({
          where: {
            ...whereClause,
            isRead: false
          }
        })
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const accessCheck = await checkNotificationAccess(id, userId, userRole);
    if (!accessCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: accessCheck.error
      });
    }

    await Notification.update(
      { 
        isRead: true, 
        readAt: new Date() 
      },
      { where: { id } }
    );

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification',
      error: error.message
    });
  }
};

// Mark all notifications as read for current user
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let whereClause = { isRead: false };
    
    // If not admin, only update user's notifications
    if (userRole !== 'admin') {
      whereClause.userId = userId;
    }

    const [updatedCount] = await Notification.update(
      { 
        isRead: true, 
        readAt: new Date() 
      },
      { where: whereClause }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        updatedCount
      }
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notifications',
      error: error.message
    });
  }
};

// Delete notification (soft delete by setting expiry)
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const accessCheck = await checkNotificationAccess(id, userId, userRole);
    if (!accessCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: accessCheck.error
      });
    }

    // Soft delete by setting expiry to now
    await Notification.update(
      { expiresAt: new Date() },
      { where: { id } }
    );

    res.json({
      success: true,
      message: 'Notification deleted'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
};

// Create notification (Admin only)
const createNotification = async (req, res) => {
  try {
    const {
      userId,
      title,
      message,
      type,
      priority = 'medium',
      actionUrl,
      expiresAt,
      sendToAll = false,
      userRole = null // Target specific role
    } = req.body;

    // Validation
    if (!title || !message || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title, message, and type are required'
      });
    }

    const validTypes = ['order', 'delivery', 'promotion', 'system', 'payment'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification type'
      });
    }

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority level'
      });
    }

    const notifications = [];

    if (sendToAll || userRole) {
      // Send to all users or specific role
      let whereClause = { isActive: true };
      if (userRole && !sendToAll) {
        whereClause.role = userRole;
      }

      const targetUsers = await User.findAll({
        where: whereClause,
        attributes: ['id']
      });

      for (const user of targetUsers) {
        notifications.push({
          userId: user.id,
          title,
          message,
          type,
          priority,
          actionUrl,
          expiresAt: expiresAt ? new Date(expiresAt) : null
        });
      }
    } else if (userId) {
      // Send to specific user
      const targetUser = await User.findByPk(userId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'Target user not found'
        });
      }

      notifications.push({
        userId,
        title,
        message,
        type,
        priority,
        actionUrl,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      });
    } else {
      // If no userId specified, send to current user (self-notification)
      notifications.push({
        userId: req.user.id,
        title,
        message,
        type,
        priority,
        actionUrl,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      });
    }

    const createdNotifications = await Notification.bulkCreate(notifications);

    res.status(201).json({
      success: true,
      message: `${createdNotifications.length} notification(s) created successfully`,
      data: createdNotifications
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating notification',
      error: error.message
    });
  }
};

// Get notification statistics (Admin only)
const getNotificationStats = async (req, res) => {
  try {
    const { period = 'this_week' } = req.query;
    
    let dateFilter = {};
    const now = moment();

    switch (period) {
      case 'today':
        dateFilter = {
          createdAt: {
            [Op.gte]: now.startOf('day').toDate(),
            [Op.lte]: now.endOf('day').toDate()
          }
        };
        break;
      case 'this_week':
        dateFilter = {
          createdAt: {
            [Op.gte]: now.startOf('week').toDate(),
            [Op.lte]: now.endOf('week').toDate()
          }
        };
        break;
      case 'this_month':
        dateFilter = {
          createdAt: {
            [Op.gte]: now.startOf('month').toDate(),
            [Op.lte]: now.endOf('month').toDate()
          }
        };
        break;
    }

    const [
      totalNotifications,
      unreadNotifications,
      notificationsByType,
      notificationsByPriority,
      recentActivity
    ] = await Promise.all([
      // Total notifications
      Notification.count({ where: dateFilter }),
      
      // Unread notifications
      Notification.count({ 
        where: { ...dateFilter, isRead: false } 
      }),
      
      // By type
      Notification.findAll({
        where: dateFilter,
        attributes: [
          'type',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['type']
      }),
      
      // By priority
      Notification.findAll({
        where: dateFilter,
        attributes: [
          'priority',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['priority']
      }),
      
      // Recent activity
      Notification.findAll({
        where: dateFilter,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'role']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 10
      })
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          total: totalNotifications,
          unread: unreadNotifications,
          readRate: totalNotifications > 0 ? 
            ((totalNotifications - unreadNotifications) / totalNotifications * 100).toFixed(2) : 0
        },
        byType: notificationsByType,
        byPriority: notificationsByPriority,
        recentActivity,
        period
      }
    });

  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notification statistics',
      error: error.message
    });
  }
};

// Clean up expired notifications (Admin only)
const cleanupExpiredNotifications = async (req, res) => {
  try {
    const deletedCount = await Notification.destroy({
      where: {
        expiresAt: {
          [Op.lt]: new Date()
        }
      }
    });

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} expired notifications`
    });

  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up notifications',
      error: error.message
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getNotificationStats,
  cleanupExpiredNotifications
};
