const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

class RealTimeNotificationService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: [
          process.env.FRONTEND_URL || "http://localhost:3000",
          "http://127.0.0.1:5500",
          "http://localhost:5500",
          "http://127.0.0.1:3000",
          "file://"
        ],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
      },
      path: '/socket.io'
    });

    this.userSockets = new Map(); // Map userId to socket connections
    this.setupSocketHandlers();
  }

  // Socket authentication middleware
  async authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const cleanToken = token.replace('Bearer ', '');
      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
      
      const user = await User.findByPk(decoded.userId || decoded.id, {
        attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'isActive']
      });

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.userId = user.id;
      socket.userRole = user.role;
      socket.user = user;
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Invalid authentication token'));
    }
  }

  setupSocketHandlers() {
    // Authentication middleware
    this.io.use(this.authenticateSocket.bind(this));

    this.io.on('connection', (socket) => {
      console.log(`User ${socket.userId} connected to notifications`);
      
      // Store user socket connection
      if (!this.userSockets.has(socket.userId)) {
        this.userSockets.set(socket.userId, new Set());
      }
      this.userSockets.get(socket.userId).add(socket);

      // Join user to their personal room
      socket.join(`user_${socket.userId}`);
      
      // Join role-based rooms
      socket.join(`role_${socket.userRole}`);
      
      // Admin joins admin room
      if (socket.userRole === 'admin') {
        socket.join('admin_room');
      }

      // Handle client events
      socket.on('notification_read', async (notificationId) => {
        try {
          // Update notification as read in database
          const { Notification } = require('../models');
          await Notification.update(
            { isRead: true, readAt: new Date() },
            { where: { id: notificationId, userId: socket.userId } }
          );
          
          // Broadcast to user's other connections
          socket.to(`user_${socket.userId}`).emit('notification_updated', {
            notificationId,
            isRead: true
          });
        } catch (error) {
          console.error('Error marking notification as read:', error);
          socket.emit('error', { message: 'Failed to mark notification as read' });
        }
      });

      socket.on('get_unread_count', async () => {
        try {
          const { Notification } = require('../models');
          const count = await Notification.count({
            where: { 
              userId: socket.userId, 
              isRead: false,
              [require('sequelize').Op.or]: [
                { expiresAt: null },
                { expiresAt: { [require('sequelize').Op.gt]: new Date() } }
              ]
            }
          });
          
          socket.emit('unread_count', count);
        } catch (error) {
          console.error('Error getting unread count:', error);
          socket.emit('error', { message: 'Failed to get unread count' });
        }
      });

      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected from notifications`);
        
        // Remove socket from user's connections
        if (this.userSockets.has(socket.userId)) {
          this.userSockets.get(socket.userId).delete(socket);
          
          // If no more connections, remove user from map
          if (this.userSockets.get(socket.userId).size === 0) {
            this.userSockets.delete(socket.userId);
          }
        }
      });

      // Send current unread count on connection
      socket.emit('connected', {
        message: 'Connected to notification service',
        userId: socket.userId,
        role: socket.userRole
      });
    });
  }

  // Send notification to specific user
  async sendToUser(userId, notification) {
    try {
      const room = `user_${userId}`;
      this.io.to(room).emit('new_notification', notification);
      
      // Also send unread count update
      const { Notification } = require('../models');
      const unreadCount = await Notification.count({
        where: { 
          userId, 
          isRead: false,
          [require('sequelize').Op.or]: [
            { expiresAt: null },
            { expiresAt: { [require('sequelize').Op.gt]: new Date() } }
          ]
        }
      });
      
      this.io.to(room).emit('unread_count', unreadCount);
      
      return true;
    } catch (error) {
      console.error('Error sending real-time notification to user:', error);
      return false;
    }
  }

  // Send notification to multiple users
  async sendToUsers(userIds, notification) {
    try {
      const promises = userIds.map(userId => this.sendToUser(userId, notification));
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error sending real-time notifications to users:', error);
      return false;
    }
  }

  // Send notification to role
  async sendToRole(role, notification) {
    try {
      const room = `role_${role}`;
      this.io.to(room).emit('new_notification', notification);
      return true;
    } catch (error) {
      console.error('Error sending real-time notification to role:', error);
      return false;
    }
  }

  // Send notification to all connected users
  async sendToAll(notification) {
    try {
      this.io.emit('new_notification', notification);
      return true;
    } catch (error) {
      console.error('Error sending real-time notification to all:', error);
      return false;
    }
  }

  // Send admin-specific notifications
  async sendToAdmins(notification) {
    try {
      this.io.to('admin_room').emit('new_notification', notification);
      return true;
    } catch (error) {
      console.error('Error sending real-time notification to admins:', error);
      return false;
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.userSockets.size;
  }

  // Get connected users by role
  getConnectedUsersByRole(role) {
    let count = 0;
    for (const [userId, sockets] of this.userSockets) {
      if (sockets.size > 0) {
        // Check if any socket of this user has the specified role
        for (const socket of sockets) {
          if (socket.userRole === role) {
            count++;
            break;
          }
        }
      }
    }
    return count;
  }

  // Disconnect user
  disconnectUser(userId) {
    if (this.userSockets.has(userId)) {
      const sockets = this.userSockets.get(userId);
      for (const socket of sockets) {
        socket.disconnect(true);
      }
      this.userSockets.delete(userId);
    }
  }

  // Send system-wide announcement
  async sendSystemAnnouncement(title, message, priority = 'medium') {
    try {
      const announcement = {
        id: Date.now(), // Temporary ID for real-time display
        title,
        message,
        type: 'system',
        priority,
        isRead: false,
        createdAt: new Date(),
        isSystemAnnouncement: true
      };

      this.io.emit('system_announcement', announcement);
      return true;
    } catch (error) {
      console.error('Error sending system announcement:', error);
      return false;
    }
  }
}

let realTimeService = null;

module.exports = {
  initializeRealTimeNotifications: (server) => {
    realTimeService = new RealTimeNotificationService(server);
    return realTimeService;
  },
  getRealTimeService: () => realTimeService
};
