const { Notification, User, Order, Staff } = require('../models');
const moment = require('moment');

class NotificationService {
  
  // Get real-time service instance
  static getRealTimeService() {
    try {
      const { getRealTimeService } = require('./realTimeNotificationService');
      return getRealTimeService();
    } catch (error) {
      console.warn('Real-time service not available:', error.message);
      return null;
    }
  }

  // Send notification to specific user
  static async sendToUser(userId, notificationData) {
    try {
      const notification = await Notification.create({
        userId,
        ...notificationData
      });

      // Send real-time notification
      const realTimeService = this.getRealTimeService();
      if (realTimeService) {
        await realTimeService.sendToUser(userId, notification);
      }

      return notification;
    } catch (error) {
      console.error('Error sending notification to user:', error);
      throw error;
    }
  }

  // Send notification to multiple users
  static async sendToUsers(userIds, notificationData) {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        ...notificationData
      }));
      
      const createdNotifications = await Notification.bulkCreate(notifications, { returning: true });

      // Send real-time notifications
      const realTimeService = this.getRealTimeService();
      if (realTimeService) {
        await realTimeService.sendToUsers(userIds, notificationData);
      }

      return createdNotifications;
    } catch (error) {
      console.error('Error sending notifications to users:', error);
      throw error;
    }
  }

  // Send notification to all users of a specific role
  static async sendToRole(role, notificationData) {
    try {
      const users = await User.findAll({
        where: { role, isActive: true },
        attributes: ['id']
      });
      
      const userIds = users.map(user => user.id);
      const createdNotifications = await this.sendToUsers(userIds, notificationData);

      // Send real-time notification to role
      const realTimeService = this.getRealTimeService();
      if (realTimeService) {
        await realTimeService.sendToRole(role, notificationData);
      }

      return createdNotifications;
    } catch (error) {
      console.error('Error sending notifications to role:', error);
      throw error;
    }
  }

  // Send notification to all active users
  static async sendToAll(notificationData) {
    try {
      const users = await User.findAll({
        where: { isActive: true },
        attributes: ['id']
      });
      
      const userIds = users.map(user => user.id);
      return await this.sendToUsers(userIds, notificationData);
    } catch (error) {
      console.error('Error sending notifications to all users:', error);
      throw error;
    }
  }

  // Order-related notifications
  static async notifyNewOrder(orderId, customerId) {
    try {
      const order = await Order.findByPk(orderId, {
        include: [{ model: User, as: 'customer' }]
      });

      if (!order) return;

      // Notify customer
      await this.sendToUser(customerId, {
        title: 'Order Confirmed',
        message: `Your order #${order.orderNumber} has been confirmed and is being prepared.`,
        type: 'order',
        priority: 'medium',
        actionUrl: `/orders/${orderId}`
      });

      // Notify all admins
      await this.sendToRole('admin', {
        title: 'New Order Received',
        message: `New order #${order.orderNumber} from ${order.customer?.firstName || 'Customer'} - $${order.total}`,
        type: 'order',
        priority: 'high',
        actionUrl: `/admin/orders/${orderId}`
      });

      // Notify kitchen staff
      await this.sendToRole('staff', {
        title: 'New Order for Kitchen',
        message: `Order #${order.orderNumber} needs preparation - ${order.orderItems?.length || 0} items`,
        type: 'order',
        priority: 'high',
        actionUrl: `/kitchen/orders/${orderId}`
      });

    } catch (error) {
      console.error('Error sending new order notifications:', error);
    }
  }

  static async notifyOrderStatusChange(orderId, newStatus, customerId) {
    try {
      const order = await Order.findByPk(orderId);
      if (!order) return;

      const statusMessages = {
        'confirmed': 'Your order has been confirmed and is being prepared.',
        'preparing': 'Your order is now being prepared in the kitchen.',
        'ready': 'Your order is ready for pickup/delivery!',
        'out_for_delivery': 'Your order is out for delivery and will arrive soon.',
        'delivered': 'Your order has been delivered. Enjoy your meal!',
        'cancelled': 'Your order has been cancelled. You will be refunded shortly.'
      };

      const priorities = {
        'confirmed': 'medium',
        'preparing': 'medium',
        'ready': 'high',
        'out_for_delivery': 'high',
        'delivered': 'medium',
        'cancelled': 'urgent'
      };

      await this.sendToUser(customerId, {
        title: `Order ${newStatus.replace('_', ' ').toUpperCase()}`,
        message: statusMessages[newStatus] || `Your order status has been updated to ${newStatus}.`,
        type: 'order',
        priority: priorities[newStatus] || 'medium',
        actionUrl: `/orders/${orderId}`
      });

    } catch (error) {
      console.error('Error sending order status notification:', error);
    }
  }

  // Payment-related notifications
  static async notifyPaymentConfirmed(orderId, customerId, amount) {
    try {
      await this.sendToUser(customerId, {
        title: 'Payment Confirmed',
        message: `Your payment of $${amount} has been processed successfully.`,
        type: 'payment',
        priority: 'medium',
        actionUrl: `/orders/${orderId}`
      });

      // Notify admins
      await this.sendToRole('admin', {
        title: 'Payment Received',
        message: `Payment of $${amount} confirmed for order #${orderId}`,
        type: 'payment',
        priority: 'low',
        actionUrl: `/admin/orders/${orderId}`
      });

    } catch (error) {
      console.error('Error sending payment notification:', error);
    }
  }

  static async notifyPaymentFailed(orderId, customerId, amount) {
    try {
      await this.sendToUser(customerId, {
        title: 'Payment Failed',
        message: `Your payment of $${amount} could not be processed. Please try again or use a different payment method.`,
        type: 'payment',
        priority: 'urgent',
        actionUrl: `/orders/${orderId}/payment`
      });

    } catch (error) {
      console.error('Error sending payment failed notification:', error);
    }
  }

  // Delivery-related notifications
  static async notifyDeliveryAssigned(orderId, customerId, deliveryStaffId) {
    try {
      const staff = await User.findByPk(deliveryStaffId);
      
      await this.sendToUser(customerId, {
        title: 'Delivery Driver Assigned',
        message: `${staff?.firstName || 'A driver'} has been assigned to deliver your order.`,
        type: 'delivery',
        priority: 'medium',
        actionUrl: `/orders/${orderId}/tracking`
      });

      await this.sendToUser(deliveryStaffId, {
        title: 'New Delivery Assignment',
        message: `You have been assigned a new delivery for order #${orderId}`,
        type: 'delivery',
        priority: 'high',
        actionUrl: `/delivery/orders/${orderId}`
      });

    } catch (error) {
      console.error('Error sending delivery assignment notification:', error);
    }
  }

  // Promotional notifications
  static async notifyPromotion(title, message, targetRole = null, expiresAt = null) {
    try {
      const notificationData = {
        title,
        message,
        type: 'promotion',
        priority: 'low',
        expiresAt: expiresAt ? new Date(expiresAt) : null
      };

      if (targetRole) {
        return await this.sendToRole(targetRole, notificationData);
      } else {
        return await this.sendToAll(notificationData);
      }

    } catch (error) {
      console.error('Error sending promotion notification:', error);
    }
  }

  // System notifications
  static async notifySystemMaintenance(title, message, scheduledTime) {
    try {
      await this.sendToAll({
        title,
        message,
        type: 'system',
        priority: 'high',
        expiresAt: new Date(scheduledTime)
      });

    } catch (error) {
      console.error('Error sending system maintenance notification:', error);
    }
  }

  static async notifyLowStock(itemName, currentStock, minimumStock) {
    try {
      await this.sendToRole('admin', {
        title: 'Low Stock Alert',
        message: `${itemName} is running low. Current stock: ${currentStock}, Minimum: ${minimumStock}`,
        type: 'system',
        priority: 'urgent',
        actionUrl: '/admin/inventory'
      });

    } catch (error) {
      console.error('Error sending low stock notification:', error);
    }
  }

  static async notifyNewStaffRegistration(newStaffId, adminUserId = null) {
    try {
      const staff = await User.findByPk(newStaffId);
      
      const notificationData = {
        title: 'New Staff Member',
        message: `${staff?.firstName} ${staff?.lastName} has joined the team as ${staff?.role}`,
        type: 'system',
        priority: 'medium',
        actionUrl: `/admin/staff/${newStaffId}`
      };

      if (adminUserId) {
        await this.sendToUser(adminUserId, notificationData);
      } else {
        await this.sendToRole('admin', notificationData);
      }

    } catch (error) {
      console.error('Error sending new staff notification:', error);
    }
  }

  // Customer engagement notifications
  static async notifyLoyaltyPoints(customerId, pointsEarned, totalPoints) {
    try {
      await this.sendToUser(customerId, {
        title: 'Loyalty Points Earned!',
        message: `You've earned ${pointsEarned} points! Total points: ${totalPoints}`,
        type: 'promotion',
        priority: 'low',
        actionUrl: '/profile/loyalty'
      });

    } catch (error) {
      console.error('Error sending loyalty points notification:', error);
    }
  }

  static async notifyOrderRating(customerId, orderId) {
    try {
      // Send after a delay to ensure order is delivered
      setTimeout(async () => {
        await this.sendToUser(customerId, {
          title: 'Rate Your Order',
          message: 'How was your order? Your feedback helps us improve!',
          type: 'order',
          priority: 'low',
          actionUrl: `/orders/${orderId}/rating`,
          expiresAt: moment().add(7, 'days').toDate() // Expire after 7 days
        });
      }, 30 * 60 * 1000); // Wait 30 minutes after delivery

    } catch (error) {
      console.error('Error sending rating notification:', error);
    }
  }

  // Staff performance notifications
  static async notifyPerformanceMilestone(staffId, milestone, achievement) {
    try {
      await this.sendToUser(staffId, {
        title: 'Achievement Unlocked!',
        message: `Congratulations! You've reached ${milestone}: ${achievement}`,
        type: 'system',
        priority: 'medium',
        actionUrl: '/staff/profile'
      });

    } catch (error) {
      console.error('Error sending performance notification:', error);
    }
  }

  // Security notifications
  static async notifySecurityAlert(userId, alertType, details) {
    try {
      await this.sendToUser(userId, {
        title: 'Security Alert',
        message: `${alertType}: ${details}`,
        type: 'system',
        priority: 'urgent',
        actionUrl: '/profile/security'
      });

    } catch (error) {
      console.error('Error sending security notification:', error);
    }
  }

  // Cleanup expired notifications
  static async cleanupExpiredNotifications() {
    try {
      const deletedCount = await Notification.destroy({
        where: {
          expiresAt: {
            [require('sequelize').Op.lt]: new Date()
          }
        }
      });

      console.log(`Cleaned up ${deletedCount} expired notifications`);
      return deletedCount;

    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }

  // Get notification preferences (placeholder for future feature)
  static async getUserNotificationPreferences(userId) {
    // This would integrate with a user preferences table
    // For now, return default preferences
    return {
      order: true,
      delivery: true,
      promotion: true,
      system: true,
      payment: true,
      emailNotifications: true,
      pushNotifications: true
    };
  }
}

module.exports = NotificationService;
