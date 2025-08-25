const { sequelize, Notification } = require('../models');

async function showAllNotifications() {
  try {
    console.log('📢 FUDO NOTIFICATIONS EXPLANATION');
    console.log('===================================\n');

    // Get all notifications ordered by creation time
    const notifications = await Notification.findAll({
      order: [['createdAt', 'ASC']]
    });

    if (notifications.length === 0) {
      console.log('🔍 No notifications found in database');
      return;
    }

    console.log(`📊 Total notifications: ${notifications.length}\n`);

    // Group notifications by type
    const notificationsByType = {};
    notifications.forEach(notification => {
      const type = notification.type;
      if (!notificationsByType[type]) {
        notificationsByType[type] = [];
      }
      notificationsByType[type].push(notification);
    });

    // Explain each notification type
    const explanations = {
      'ORDER_PLACED': '🛒 Customer places a new order',
      'ORDER_CONFIRMED': '✅ Admin/Restaurant confirms the order',
      'ORDER_PREPARING': '👨‍🍳 Kitchen starts preparing the order',
      'ORDER_READY': '🍽️ Food is ready for pickup',
      'ORDER_PICKED_UP': '🚛 Delivery driver picks up the order',
      'ORDER_OUT_FOR_DELIVERY': '🛵 Order is out for delivery',
      'ORDER_DELIVERED': '📦 Order successfully delivered',
      'ORDER_CANCELLED': '❌ Order was cancelled',
      'PAYMENT_RECEIVED': '💰 Payment processed successfully',
      'STOCK_LOW': '⚠️ Menu item stock is running low',
      'STOCK_OUT': '🚫 Menu item is out of stock',
      'DELIVERY_ASSIGNED': '👤 Delivery person assigned to order'
    };

    // Show count and explanation for each type
    console.log('📋 NOTIFICATION TYPES BREAKDOWN:');
    console.log('─'.repeat(50));
    for (const [type, notifications] of Object.entries(notificationsByType)) {
      const count = notifications.length;
      const explanation = explanations[type] || '❓ Unknown notification type';
      console.log(`${explanation} → ${count} notification${count > 1 ? 's' : ''}`);
    }

    console.log('\n📝 DETAILED NOTIFICATION LOG:');
    console.log('─'.repeat(50));
    
    notifications.forEach((notification, index) => {
      const time = new Date(notification.createdAt).toLocaleTimeString();
      const explanation = explanations[notification.type] || '❓ Unknown';
      
      console.log(`${index + 1}. [${time}] ${explanation}`);
      console.log(`   📧 To: ${notification.recipientType} (ID: ${notification.recipientId})`);
      console.log(`   💬 Message: ${notification.message}`);
      if (notification.metadata && Object.keys(notification.metadata).length > 0) {
        console.log(`   📋 Data: ${JSON.stringify(notification.metadata, null, 2)}`);
      }
      console.log('');
    });

    // Show order flow summary
    const orderNotifications = notifications.filter(n => 
      ['ORDER_PLACED', 'ORDER_CONFIRMED', 'ORDER_PREPARING', 'ORDER_READY', 
       'ORDER_PICKED_UP', 'ORDER_OUT_FOR_DELIVERY', 'ORDER_DELIVERED'].includes(n.type)
    );

    if (orderNotifications.length > 0) {
      console.log('\n🔄 ORDER FLOW SEQUENCE:');
      console.log('─'.repeat(50));
      orderNotifications.forEach((notification, index) => {
        const time = new Date(notification.createdAt).toLocaleTimeString();
        const stepNumber = index + 1;
        console.log(`${stepNumber}. [${time}] ${notification.type.replace('ORDER_', '').replace('_', ' ')}`);
      });
    }

  } catch (error) {
    console.error('❌ Error fetching notifications:', error.message);
  } finally {
    await sequelize.close();
  }
}

showAllNotifications();
