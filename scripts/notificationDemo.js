const { sequelize, User, Order, OrderItem, MenuItem, Notification, Delivery, Staff, Payment } = require('../models');
const bcrypt = require('bcryptjs');

async function simulateOrderWithNotifications() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🍕 FUDO NOTIFICATION DEMO');
    console.log('=========================\n');

    // Get customer
    const customer = await User.findOne({ 
      where: { email: 'bendifallahrachid@gmail.com' } 
    });

    if (!customer) {
      console.log('❌ Customer not found');
      return;
    }

    // Get admin
    const admin = await User.findOne({ 
      where: { role: 'admin' } 
    });

    // Get some menu items
    const menuItems = await MenuItem.findAll({ limit: 2 });
    if (menuItems.length === 0) {
      console.log('❌ No menu items found');
      return;
    }

    console.log('🎬 STARTING ORDER SIMULATION...\n');

    // STEP 1: Customer places order
    console.log('📝 STEP 1: Customer places order');
    const order = await Order.create({
      customerId: customer.id,
      deliveryAddress: '123 Main Street, Algiers',
      phone: customer.phone,
      status: 'pending',
      orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      subtotal: 25.98,
      tax: 2.60,
      deliveryFee: 4.99,
      total: 33.57,
      paymentMethod: 'cash_on_delivery',
      specialInstructions: 'Demo order for notification testing'
    }, { transaction });

    // Add order items
    await OrderItem.create({
      orderId: order.id,
      menuItemId: menuItems[0].id,
      quantity: 2,
      unitPrice: menuItems[0].price,
      totalPrice: menuItems[0].price * 2
    }, { transaction });

    // Notification 1: ORDER_PLACED
    const notification1 = await Notification.create({
      userId: customer.id,
      title: 'Order Placed Successfully',
      message: `Your order ${order.orderNumber} has been placed successfully. Total: $${order.total}`,
      type: 'order',
      isRead: false,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total
      }
    }, { transaction });
    console.log('✅ Notification 1: ORDER_PLACED - Customer notified that order was placed');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // STEP 2: Admin confirms order
    console.log('\n📝 STEP 2: Admin confirms order');
    await order.update({ 
      status: 'confirmed',
      confirmedAt: new Date(),
      confirmedBy: admin?.id 
    }, { transaction });

    // Notification 2: ORDER_CONFIRMED (to customer)
    const notification2 = await Notification.create({
      userId: customer.id,
      title: 'Order Confirmed',
      message: `Great news! Your order ${order.orderNumber} has been confirmed by the restaurant and will be prepared shortly.`,
      type: 'order',
      isRead: false,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        confirmedBy: admin?.firstName || 'Restaurant'
      }
    }, { transaction });
    console.log('✅ Notification 2: ORDER_CONFIRMED - Customer notified that restaurant confirmed order');

    // Notification 3: ORDER_CONFIRMED (to admin/kitchen)
    if (admin) {
      const notification3 = await Notification.create({
        userId: admin.id,
        title: 'New Order to Prepare',
        message: `Order ${order.orderNumber} confirmed and ready for preparation. Customer: ${customer.firstName} ${customer.lastName}`,
        type: 'order',
        isRead: false,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: `${customer.firstName} ${customer.lastName}`
        }
      }, { transaction });
      console.log('✅ Notification 3: ORDER_CONFIRMED - Kitchen/Admin notified to start preparation');
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // STEP 3: Kitchen starts preparing
    console.log('\n📝 STEP 3: Kitchen starts preparing');
    await order.update({ 
      status: 'preparing',
      preparationStartedAt: new Date() 
    }, { transaction });

    // Notification 4: ORDER_PREPARING
    const notification4 = await Notification.create({
      userId: customer.id,
      title: 'Order Being Prepared',
      message: `Your order ${order.orderNumber} is now being prepared by our kitchen. Estimated preparation time: 15-20 minutes.`,
      type: 'order',
      isRead: false,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        estimatedTime: '15-20 minutes'
      }
    }, { transaction });
    console.log('✅ Notification 4: ORDER_PREPARING - Customer notified that kitchen started preparation');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // STEP 4: Order ready for pickup
    console.log('\n📝 STEP 4: Order ready for pickup');
    await order.update({ 
      status: 'ready',
      readyAt: new Date() 
    }, { transaction });

    // Notification 5: ORDER_READY (to customer)
    const notification5 = await Notification.create({
      userId: customer.id,
      title: 'Order Ready!',
      message: `Your order ${order.orderNumber} is ready and waiting for pickup by our delivery team.`,
      type: 'order',
      isRead: false,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber
      }
    }, { transaction });
    console.log('✅ Notification 5: ORDER_READY - Customer notified that order is ready for pickup');

    // Get delivery staff
    let deliveryStaff = await User.findOne({ 
      where: { email: 'delivery@fudo.com' } 
    });

    if (deliveryStaff) {
      // Notification 6: ORDER_READY (to delivery staff)
      const notification6 = await Notification.create({
        userId: deliveryStaff.id,
        title: 'Order Ready for Pickup',
        message: `Order ${order.orderNumber} is ready for pickup. Customer: ${customer.firstName} ${customer.lastName}, Address: ${order.deliveryAddress}`,
        type: 'delivery',
        isRead: false,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: `${customer.firstName} ${customer.lastName}`,
          deliveryAddress: order.deliveryAddress
        }
      }, { transaction });
      console.log('✅ Notification 6: ORDER_READY - Delivery staff notified to pickup order');

      await new Promise(resolve => setTimeout(resolve, 1000));

      // STEP 5: Delivery assigned and picked up
      console.log('\n📝 STEP 5: Delivery assigned and picked up');
      
      // Create delivery record
      const delivery = await Delivery.create({
        orderId: order.id,
        deliveryPersonId: null, // Will be assigned later
        status: 'assigned',
        estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        deliveryFee: order.deliveryFee,
        deliveryAddress: order.deliveryAddress
      }, { transaction });

      // Notification 7: DELIVERY_ASSIGNED
      const notification7 = await Notification.create({
        userId: customer.id,
        title: 'Delivery Driver Assigned',
        message: `${deliveryStaff.firstName} ${deliveryStaff.lastName} has been assigned to deliver your order ${order.orderNumber}. Estimated delivery time: 30 minutes.`,
        type: 'delivery',
        isRead: false,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          driverName: `${deliveryStaff.firstName} ${deliveryStaff.lastName}`,
          estimatedTime: '30 minutes'
        }
      }, { transaction });
      console.log('✅ Notification 7: DELIVERY_ASSIGNED - Customer notified about assigned delivery driver');

      await new Promise(resolve => setTimeout(resolve, 1000));

      // STEP 6: Order picked up
      console.log('\n📝 STEP 6: Order picked up from restaurant');
      await order.update({ status: 'picked_up' }, { transaction });
      await delivery.update({ 
        status: 'picked_up',
        pickedUpAt: new Date() 
      }, { transaction });

      // Notification 8: ORDER_PICKED_UP
      const notification8 = await Notification.create({
        userId: customer.id,
        title: 'Order Picked Up',
        message: `${deliveryStaff.firstName} has picked up your order ${order.orderNumber} and is on the way to your location.`,
        type: 'delivery',
        isRead: false,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          driverName: deliveryStaff.firstName
        }
      }, { transaction });
      console.log('✅ Notification 8: ORDER_PICKED_UP - Customer notified that driver picked up order');

      await new Promise(resolve => setTimeout(resolve, 1000));

      // STEP 7: Out for delivery
      console.log('\n📝 STEP 7: Out for delivery');
      await order.update({ status: 'out_for_delivery' }, { transaction });
      await delivery.update({ status: 'in_transit' }, { transaction });

      // Notification 9: ORDER_OUT_FOR_DELIVERY
      const notification9 = await Notification.create({
        userId: customer.id,
        title: 'Order Out for Delivery',
        message: `Your order ${order.orderNumber} is out for delivery and should arrive within 15 minutes.`,
        type: 'delivery',
        isRead: false,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          estimatedArrival: '15 minutes'
        }
      }, { transaction });
      console.log('✅ Notification 9: ORDER_OUT_FOR_DELIVERY - Customer notified that order is on the way');

      await new Promise(resolve => setTimeout(resolve, 1000));

      // STEP 8: Order delivered
      console.log('\n📝 STEP 8: Order delivered');
      await order.update({ 
        status: 'delivered',
        deliveredAt: new Date() 
      }, { transaction });
      await delivery.update({ 
        status: 'delivered',
        deliveredAt: new Date() 
      }, { transaction });

      // Notification 10: ORDER_DELIVERED
      const notification10 = await Notification.create({
        userId: customer.id,
        title: 'Order Delivered!',
        message: `Your order ${order.orderNumber} has been successfully delivered. Thank you for choosing Fudo! Please rate your experience.`,
        type: 'delivery',
        isRead: false,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          deliveredAt: new Date().toISOString()
        }
      }, { transaction });
      console.log('✅ Notification 10: ORDER_DELIVERED - Customer notified of successful delivery');

      await new Promise(resolve => setTimeout(resolve, 1000));

      // STEP 9: Payment processed
      console.log('\n📝 STEP 9: Payment processed');
      const payment = await Payment.create({
        orderId: order.id,
        amount: order.total,
        method: 'cash_on_delivery',
        status: 'completed',
        transactionId: `TXN-${Date.now()}`,
        paidAt: new Date()
      }, { transaction });

      // Notification 11: PAYMENT_RECEIVED
      const notification11 = await Notification.create({
        userId: customer.id,
        title: 'Payment Received',
        message: `Payment of $${order.total} has been successfully received for order ${order.orderNumber}. Thank you!`,
        type: 'payment',
        isRead: false,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: order.total,
          method: 'Cash on Delivery'
        }
      }, { transaction });
      console.log('✅ Notification 11: PAYMENT_RECEIVED - Customer notified of successful payment');
    }

    await transaction.commit();

    console.log('\n🎉 NOTIFICATION SIMULATION COMPLETE!');
    console.log('=====================================\n');

    // Show summary
    const allNotifications = await Notification.findAll({
      where: { userId: customer.id },
      order: [['createdAt', 'ASC']]
    });

    console.log('📊 NOTIFICATION SUMMARY:');
    console.log(`Total notifications created: ${allNotifications.length}`);
    console.log('\n📝 NOTIFICATION FLOW:');
    allNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.title}`);
      console.log(`   Type: ${notif.type.toUpperCase()}`);
      console.log(`   Message: ${notif.message}`);
      console.log('');
    });

    console.log('💡 WHY SO MANY "ORDER CONFIRMED" NOTIFICATIONS?');
    console.log('================================================');
    console.log('You might see multiple notifications that seem similar, but each serves a different purpose:');
    console.log('');
    console.log('1. ORDER_CONFIRMED (to Customer): "Your order has been confirmed by the restaurant"');
    console.log('   → Reassures customer that restaurant accepted their order');
    console.log('');
    console.log('2. ORDER_CONFIRMED (to Kitchen/Admin): "New order ready for preparation"');
    console.log('   → Alerts kitchen staff to start preparing the food');
    console.log('');
    console.log('3. ORDER_PREPARING: "Your order is being prepared"');
    console.log('   → Updates customer on current status');
    console.log('');
    console.log('Each notification targets different recipients and serves different purposes in the workflow!');

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

simulateOrderWithNotifications();
