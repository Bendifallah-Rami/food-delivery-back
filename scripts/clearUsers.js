const models = require('../models');
const { testConnection } = require('../config/database');

async function clearAllData() {
  try {
    await testConnection();
    console.log('🔗 Database connected');
    
    // Get all available models
    const { User, Order, OrderItem, Payment, Delivery, UserAddress, Staff } = models;
    
    // Clear in order of dependencies (child tables first)
    console.log('🗑️ Clearing deliveries...');
    const deletedDeliveries = await Delivery.destroy({ where: {} });
    console.log(`   ✅ Deleted ${deletedDeliveries} deliveries`);
    
    console.log('🗑️ Clearing payments...');
    const deletedPayments = await Payment.destroy({ where: {} });
    console.log(`   ✅ Deleted ${deletedPayments} payments`);
    
    console.log('🗑️ Clearing order items...');
    const deletedOrderItems = await OrderItem.destroy({ where: {} });
    console.log(`   ✅ Deleted ${deletedOrderItems} order items`);
    
    console.log('🗑️ Clearing orders...');
    const deletedOrders = await Order.destroy({ where: {} });
    console.log(`   ✅ Deleted ${deletedOrders} orders`);
    
    console.log('🗑️ Clearing user addresses...');
    const deletedAddresses = await UserAddress.destroy({ where: {} });
    console.log(`   ✅ Deleted ${deletedAddresses} user addresses`);
    
    console.log('🗑️ Clearing staff...');
    const deletedStaff = await Staff.destroy({ where: {} });
    console.log(`   ✅ Deleted ${deletedStaff} staff`);
    
    console.log('🗑️ Clearing users...');
    const deletedUsers = await User.destroy({ where: {} });
    console.log(`   ✅ Deleted ${deletedUsers} users`);
    
    console.log('✅ All data cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing data:', error.message);
    process.exit(1);
  }
}

clearAllData();
