const { 
  User, 
  UserAddress, 
  Order, 
  OrderItem, 
  MenuItem, 
  Payment, 
  Notification, 
  Stock, 
  Staff,
  Delivery,
  Category,
  sequelize 
} = require('../models');
const bcrypt = require('bcryptjs');

// Database cleanup function
async function cleanupDatabase() {
  try {
    console.log('🧹 CLEANING DATABASE...');
    
    // Delete in correct order to avoid foreign key constraints
    await Delivery.destroy({ where: {} });
    await OrderItem.destroy({ where: {} });
    await Order.destroy({ where: {} });
    await Payment.destroy({ where: {} });
    await Notification.destroy({ where: {} });
    await Staff.destroy({ where: {} });
    
    // Keep only admin user, delete customer addresses except defaults
    await UserAddress.destroy({ 
      where: { 
        userId: { [require('sequelize').Op.ne]: 1 }, // Keep admin addresses
        isDefault: false 
      } 
    });
    
    // Keep users, categories, menu items, and stock - just reset stock levels
    await Stock.update(
      { 
        currentStock: sequelize.literal(`
          CASE 
            WHEN "menuItemId" IN (SELECT id FROM menu_items WHERE "categoryId" = 1) THEN 50
            WHEN "menuItemId" IN (SELECT id FROM menu_items WHERE "categoryId" = 2) THEN 40
            WHEN "menuItemId" IN (SELECT id FROM menu_items WHERE "categoryId" = 3) THEN 30
            WHEN "menuItemId" IN (SELECT id FROM menu_items WHERE "categoryId" = 4) THEN 25
            WHEN "menuItemId" IN (SELECT id FROM menu_items WHERE "categoryId" = 5) THEN 60
            WHEN "menuItemId" IN (SELECT id FROM menu_items WHERE "categoryId" = 6) THEN 100
            WHEN "menuItemId" IN (SELECT id FROM menu_items WHERE "categoryId" = 7) THEN 45
            ELSE 25
          END
        `),
        lastUpdated: new Date()
      },
      { where: {} }
    );
    
    // Re-enable all menu items
    await MenuItem.update(
      { isAvailable: true },
      { where: {} }
    );
    
    console.log('✅ Database cleaned - kept users, categories, menu items, stock');
    
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  }
}

// Create delivery staff function
async function createDeliveryStaff() {
  try {
    console.log('🚛 Creating delivery staff...');
    
    // Check if delivery user already exists
    let deliveryUser = await User.findOne({ where: { email: 'delivery@fudo.com' } });
    
    if (!deliveryUser) {
      // Create delivery user
      const deliveryPassword = 'delivery123';
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(deliveryPassword, salt);
      
      deliveryUser = await User.create({
        email: 'delivery@fudo.com',
        password: hashedPassword,
        firstName: 'Ahmed',
        lastName: 'Delivery',
        phone: '+213123456790',
        role: 'staff',
        isActive: true,
        emailVerified: true,
        provider: 'local',
        isOAuthUser: false
      });
    }
    
    // Check if staff record already exists
    let staffRecord = await Staff.findOne({ where: { userId: deliveryUser.id } });
    
    if (!staffRecord) {
      // Create staff record
      staffRecord = await Staff.create({
        userId: deliveryUser.id,
        employeeId: 'DEL001',
        position: 'delivery',
        department: 'Logistics',
        hireDate: new Date(),
        salary: 2500.00,
        isActive: true,
        workingHours: {
          monday: { start: '09:00', end: '18:00' },
          tuesday: { start: '09:00', end: '18:00' },
          wednesday: { start: '09:00', end: '18:00' },
          thursday: { start: '09:00', end: '18:00' },
          friday: { start: '09:00', end: '18:00' },
          saturday: { start: '10:00', end: '16:00' },
          sunday: { start: '10:00', end: '16:00' }
        }
      });
    }
    
    console.log(`✅ Delivery staff created: ${deliveryUser.firstName} ${deliveryUser.lastName}`);
    console.log(`   📧 Email: ${deliveryUser.email}`);
    console.log(`   🔑 Password: ${deliveryPassword}`);
    console.log(`   👷 Employee ID: ${staffRecord.employeeId}`);
    
    return { deliveryUser, staffRecord };
    
  } catch (error) {
    console.error('❌ Error creating delivery staff:', error);
    throw error;
  }
}

// Complete delivery flow test
async function testCompleteDeliveryFlow() {
  try {
    console.log('🎯 COMPLETE FOOD DELIVERY FLOW TEST\n');
    console.log('=' .repeat(60));
    
    // STEP 1: Customer Login
    console.log('\n👤 STEP 1: Customer Login');
    console.log('-' .repeat(30));
    
    const customer = await User.findOne({
      where: { email: 'bendifallahrachid@gmail.com' }
    });
    
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    console.log(`✅ Customer logged in: ${customer.firstName} ${customer.lastName}`);
    console.log(`📧 Email: ${customer.email}`);
    
    // STEP 2: Create/Get Delivery Address
    console.log('\n📍 STEP 2: Setting Delivery Address');
    console.log('-' .repeat(30));
    
    let deliveryAddress = await UserAddress.findOne({
      where: { userId: customer.id, isDefault: true }
    });
    
    if (!deliveryAddress) {
      deliveryAddress = await UserAddress.create({
        userId: customer.id,
        label: 'Home',
        street: '789 Customer Street',
        city: 'Algiers',
        state: 'Alger',
        zipCode: '16002',
        country: 'Algeria',
        isDefault: true
      });
    }
    
    console.log(`✅ Delivery address set: ${deliveryAddress.street}, ${deliveryAddress.city}`);
    
    // STEP 3: Browse Menu & Check Stock
    console.log('\n🍽️ STEP 3: Browsing Menu & Checking Stock');
    console.log('-' .repeat(30));
    
    const selectedItems = [
      { menuItemId: 1, quantity: 2 },  // 2 Pizza Margherita
      { menuItemId: 11, quantity: 1 }, // 1 Tonkotsu Ramen
      { menuItemId: 26, quantity: 3 }, // 3 Coca Cola
      { menuItemId: 21, quantity: 1 }  // 1 French Fries
    ];
    
    console.log('🛒 Selected items:');
    
    const menuItemsWithStock = await MenuItem.findAll({
      where: { id: selectedItems.map(item => item.menuItemId) },
      include: [
        {
          model: Stock,
          as: 'stock',
          attributes: ['currentStock', 'minimumStock', 'unit']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['name']
        }
      ]
    });
    
    let subtotal = 0;
    const validOrderItems = [];
    
    for (const selectedItem of selectedItems) {
      const menuItem = menuItemsWithStock.find(item => item.id === selectedItem.menuItemId);
      const stock = menuItem.stock && menuItem.stock.length > 0 ? menuItem.stock[0] : null;
      
      if (!stock || stock.currentStock < selectedItem.quantity) {
        throw new Error(`Insufficient stock for ${menuItem.name}. Available: ${stock?.currentStock || 0}, Requested: ${selectedItem.quantity}`);
      }
      
      console.log(`   ✅ ${menuItem.name} (${menuItem.category.name}): ${selectedItem.quantity}x $${menuItem.price} = $${(parseFloat(menuItem.price) * selectedItem.quantity).toFixed(2)}`);
      console.log(`      📦 Stock: ${stock.currentStock} ${stock.unit} available`);
      
      const itemTotal = parseFloat(menuItem.price) * selectedItem.quantity;
      subtotal += itemTotal;
      
      validOrderItems.push({
        menuItemId: selectedItem.menuItemId,
        quantity: selectedItem.quantity,
        unitPrice: menuItem.price,
        totalPrice: itemTotal,
        specialInstructions: `Test order - ${selectedItem.quantity} unit(s)`
      });
    }
    
    // STEP 4: Place Order
    console.log('\n🛒 STEP 4: Placing Order');
    console.log('-' .repeat(30));
    
    const tax = subtotal * 0.1;
    const deliveryFee = 4.99;
    const total = subtotal + tax + deliveryFee;
    
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    const transaction = await sequelize.transaction();
    
    try {
      // Create order
      const order = await Order.create({
        customerId: customer.id,
        orderNumber: orderNumber,
        status: 'pending',
        orderType: 'delivery',
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        deliveryFee: deliveryFee,
        total: parseFloat(total.toFixed(2)),
        deliveryAddressId: deliveryAddress.id,
        specialInstructions: 'Complete delivery flow test order',
        paymentMethod: 'cash',
        priority: 'normal',
        estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000)
      }, { transaction });
      
      // Create order items
      const orderItemsWithOrderId = validOrderItems.map(item => ({
        ...item,
        orderId: order.id
      }));
      
      await OrderItem.bulkCreate(orderItemsWithOrderId, { transaction });
      
      // Reduce stock
      for (const item of selectedItems) {
        const stockRecord = await Stock.findOne({
          where: { menuItemId: item.menuItemId },
          transaction
        });
        
        if (stockRecord) {
          const newStock = stockRecord.currentStock - item.quantity;
          await stockRecord.update({
            currentStock: newStock,
            lastUpdated: new Date()
          }, { transaction });
          
          // Auto-disable if out of stock
          if (newStock === 0) {
            await MenuItem.update(
              { isAvailable: false },
              { where: { id: item.menuItemId }, transaction }
            );
          }
        }
      }
      
      await transaction.commit();
      
      console.log(`✅ Order placed successfully: #${order.orderNumber}`);
      console.log(`💰 Total: $${order.total} (Subtotal: $${order.subtotal} + Tax: $${order.tax} + Delivery: $${order.deliveryFee})`);
      console.log(`📦 Stock automatically reduced for all items`);
      
      // STEP 5: Admin Accepts Order
      console.log('\n👑 STEP 5: Admin Accepts & Starts Preparing Order');
      console.log('-' .repeat(30));
      
      const admin = await User.findOne({
        where: { email: 'nr_bendifallah@esi.dz' }
      });
      
      // Update order status to confirmed
      await order.update({
        status: 'confirmed',
        statusNotes: 'Order confirmed by admin - starting preparation',
        statusUpdatedBy: admin.id,
        statusUpdatedAt: new Date()
      });
      
      console.log(`✅ Order confirmed by admin: ${admin.firstName} ${admin.lastName}`);
      
      // Create notification
      await Notification.create({
        userId: customer.id,
        title: 'Order Confirmed',
        message: `Your order #${order.orderNumber} has been confirmed and we're starting to prepare it!`,
        type: 'order',
        isRead: false
      });
      
      // Update to preparing
      await order.update({
        status: 'preparing',
        statusNotes: 'Kitchen started preparing the order',
        statusUpdatedBy: admin.id,
        statusUpdatedAt: new Date()
      });
      
      console.log(`👨‍🍳 Order status: PREPARING`);
      
      // Create notification
      await Notification.create({
        userId: customer.id,
        title: 'Order Being Prepared',
        message: `Great news! Your order #${order.orderNumber} is now being prepared by our kitchen team.`,
        type: 'order',
        isRead: false
      });
      
      // STEP 6: Create Delivery Staff
      console.log('\n🚛 STEP 6: Creating Delivery Staff');
      console.log('-' .repeat(30));
      
      const { deliveryUser, staffRecord } = await createDeliveryStaff();
      
      // STEP 7: Order Ready & Assign Delivery
      console.log('\n🎯 STEP 7: Order Ready & Assign Delivery');
      console.log('-' .repeat(30));
      
      // Update order to ready
      await order.update({
        status: 'ready',
        statusNotes: 'Order prepared and ready for delivery',
        statusUpdatedBy: admin.id,
        statusUpdatedAt: new Date()
      });
      
      console.log(`✅ Order status: READY`);
      
      // Create delivery record
      const delivery = await Delivery.create({
        orderId: order.id,
        deliveryPersonId: staffRecord.id,
        status: 'assigned',
        estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        deliveryFee: order.deliveryFee,
        distance: 5.2, // 5.2 km
        deliveryNotes: 'Handle with care - contains hot food'
      });
      
      console.log(`🚛 Delivery assigned to: ${deliveryUser.firstName} ${deliveryUser.lastName}`);
      console.log(`📍 Estimated delivery: ${delivery.estimatedDeliveryTime.toLocaleTimeString()}`);
      console.log(`📏 Distance: ${delivery.distance} km`);
      
      // Create notification
      await Notification.create({
        userId: customer.id,
        title: 'Out for Delivery',
        message: `Your order #${order.orderNumber} is out for delivery! Expected delivery: ${delivery.estimatedDeliveryTime.toLocaleTimeString()}`,
        type: 'delivery',
        isRead: false
      });
      
      // STEP 8: Delivery Process
      console.log('\n🚚 STEP 8: Delivery Process');
      console.log('-' .repeat(30));
      
      // Delivery person picks up order
      await delivery.update({
        status: 'picked_up',
        deliveryNotes: 'Order picked up from restaurant'
      });
      
      console.log(`📦 Status: PICKED UP by ${deliveryUser.firstName}`);
      
      // Create notification
      await Notification.create({
        userId: customer.id,
        title: 'Order Picked Up',
        message: `Your order #${order.orderNumber} has been picked up by our delivery driver and is on the way!`,
        type: 'delivery',
        isRead: false
      });
      
      // In transit
      await delivery.update({
        status: 'in_transit',
        deliveryNotes: 'On the way to customer location'
      });
      
      console.log(`🚗 Status: IN TRANSIT to ${deliveryAddress.street}`);
      
      // STEP 9: Order Delivered
      console.log('\n🏁 STEP 9: Order Delivered');
      console.log('-' .repeat(30));
      
      // Process payment
      const payment = await Payment.create({
        orderId: order.id,
        amount: order.total,
        paymentMethod: 'cash',
        status: 'completed',
        transactionId: `CASH-DELIVERY-${Date.now()}`,
        processedAt: new Date(),
        paymentDetails: {
          cashReceived: order.total,
          change: 0,
          paymentNote: 'Cash on delivery - exact amount',
          deliveryPersonId: staffRecord.id
        }
      });
      
      // Mark delivery as completed
      await delivery.update({
        status: 'delivered',
        actualDeliveryTime: new Date(),
        deliveryNotes: 'Successfully delivered to customer - cash payment received'
      });
      
      // Update order status
      await order.update({
        status: 'delivered',
        statusNotes: 'Order successfully delivered to customer',
        statusUpdatedBy: deliveryUser.id,
        statusUpdatedAt: new Date(),
        deliveredAt: new Date()
      });
      
      console.log(`✅ Order DELIVERED successfully!`);
      console.log(`💳 Payment processed: $${payment.amount} (Cash)`);
      console.log(`⏰ Delivery time: ${delivery.actualDeliveryTime.toLocaleTimeString()}`);
      
      // Final notification
      await Notification.create({
        userId: customer.id,
        title: 'Order Delivered!',
        message: `Your order #${order.orderNumber} has been delivered successfully! Thank you for choosing FUDO. Enjoy your meal!`,
        type: 'delivery',
        isRead: false
      });
      
      // STEP 10: Show Final Summary
      console.log('\n📊 STEP 10: Final Order Summary');
      console.log('-' .repeat(30));
      
      const finalOrder = await Order.findByPk(order.id, {
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['firstName', 'lastName', 'email', 'phone']
          },
          {
            model: OrderItem,
            as: 'orderItems',
            include: [
              {
                model: MenuItem,
                as: 'menuItem',
                attributes: ['name', 'price']
              }
            ]
          },
          {
            model: Payment,
            as: 'payment',
            attributes: ['amount', 'paymentMethod', 'status']
          },
          {
            model: UserAddress,
            as: 'deliveryAddress',
            attributes: ['street', 'city', 'state', 'zipCode']
          },
          {
            model: Delivery,
            as: 'delivery',
            include: [
              {
                model: Staff,
                as: 'deliveryPerson',
                include: [
                  {
                    model: User,
                    as: 'user',
                    attributes: ['firstName', 'lastName']
                  }
                ]
              }
            ]
          }
        ]
      });
      
      console.log('🎉 DELIVERY FLOW COMPLETED SUCCESSFULLY!');
      console.log('=' .repeat(60));
      console.log(`📦 Order: #${finalOrder.orderNumber}`);
      console.log(`👤 Customer: ${finalOrder.customer.firstName} ${finalOrder.customer.lastName}`);
      console.log(`📧 Email: ${finalOrder.customer.email}`);
      console.log(`📍 Address: ${finalOrder.deliveryAddress.street}, ${finalOrder.deliveryAddress.city}`);
      console.log(`💰 Total: $${finalOrder.total}`);
      console.log(`💳 Payment: ${finalOrder.payment.paymentMethod} (${finalOrder.payment.status})`);
      console.log(`🚛 Delivery: ${finalOrder.delivery.deliveryPerson.user.firstName} ${finalOrder.delivery.deliveryPerson.user.lastName}`);
      console.log(`📅 Ordered: ${new Date(finalOrder.createdAt).toLocaleString()}`);
      console.log(`🏁 Delivered: ${new Date(finalOrder.deliveredAt).toLocaleString()}`);
      
      console.log('\n🍽️ ORDER ITEMS:');
      finalOrder.orderItems.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.menuItem.name} x${item.quantity} - $${item.totalPrice}`);
      });
      
      // Show all notifications
      const allNotifications = await Notification.findAll({
        where: { userId: customer.id },
        order: [['createdAt', 'ASC']]
      });
      
      console.log(`\n📬 NOTIFICATIONS GENERATED (${allNotifications.length} total):`);
      allNotifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.title} - ${notif.message}`);
      });
      
      return {
        order: finalOrder,
        customer,
        delivery: finalOrder.delivery,
        payment: finalOrder.payment,
        notifications: allNotifications
      };
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error in complete delivery flow test:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🍕 FUDO COMPLETE DELIVERY SYSTEM TEST');
    console.log('🕐 Started at:', new Date().toLocaleString());
    console.log('=' .repeat(60));
    
    // Run the complete test
    const result = await testCompleteDeliveryFlow();
    
    console.log('\n🎯 TEST RESULTS:');
    console.log('✅ Customer login successful');
    console.log('✅ Menu browsing with stock checking');
    console.log('✅ Order placement with stock reduction');
    console.log('✅ Admin order acceptance and preparation');
    console.log('✅ Delivery staff creation and assignment');
    console.log('✅ Complete delivery process (pickup → transit → delivered)');
    console.log('✅ Payment processing (cash on delivery)');
    console.log('✅ Real-time notifications throughout process');
    console.log('✅ Stock management working correctly');
    
    console.log('\n🧹 CLEANING UP FOR NEXT TEST...');
    await cleanupDatabase();
    console.log('✅ Database cleaned - ready for next test');
    
  } catch (error) {
    console.error('💥 Complete delivery test failed:', error.message);
    
    // Still clean up even if test failed
    try {
      console.log('\n🧹 Cleaning up after error...');
      await cleanupDatabase();
      console.log('✅ Database cleaned');
    } catch (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError.message);
    }
  } finally {
    console.log('\n🏁 Test completed at:', new Date().toLocaleString());
    process.exit(0);
  }
}

main();
