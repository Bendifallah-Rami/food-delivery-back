const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function performOrderTest() {
  try {
    console.log('🔐 Step 1: Customer Login...');
    
    // Login customer
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'bendifallahrachid@gmail.com',
      password: 'customer123'
    });
    
    const customerToken = loginResponse.data.data.token;
    console.log('✅ Customer logged in successfully');
    
    const headers = {
      'Authorization': `Bearer ${customerToken}`,
      'Content-Type': 'application/json'
    };

    console.log('\n📍 Step 2: Creating delivery address...');
    
    // Create delivery address
    const addressResponse = await axios.post(`${BASE_URL}/addresses/my-addresses`, {
      label: 'Home Address',
      street: '123 Main Street',
      city: 'Algiers',
      state: 'Alger',
      zipCode: '16000',
      country: 'Algeria',
      isDefault: true
    }, { headers });
    
    const addressId = addressResponse.data.data.id;
    console.log(`✅ Address created - ID: ${addressId}`);

    console.log('\n🛒 Step 3: Creating mixed order...');
    
    // Create order with mixed items (Pizza, Burger, Drink, Ice Cream)
    const orderResponse = await axios.post(`${BASE_URL}/orders`, {
      orderItems: [
        { menuItemId: 1, quantity: 1, specialInstructions: 'Extra cheese please' },  // Pizza Margherita
        { menuItemId: 6, quantity: 1, specialInstructions: 'Medium well' },          // Classic Beef Burger  
        { menuItemId: 26, quantity: 2, specialInstructions: 'Extra ice' },           // Coca Cola
        { menuItemId: 16, quantity: 1, specialInstructions: 'Single scoop' }         // Vanilla Bean Ice Cream
      ],
      orderType: 'delivery',
      deliveryAddressId: addressId,
      specialInstructions: 'Please ring doorbell twice',
      paymentMethod: 'cash'
    }, { headers });
    
    const order = orderResponse.data.data;
    console.log('✅ Order created successfully!');
    console.log(`📦 Order ID: ${order.id}`);
    console.log(`🔢 Order Number: ${order.orderNumber}`);
    console.log(`💰 Total Amount: $${order.total}`);
    console.log(`📊 Status: ${order.status}`);
    
    console.log('\n💳 Step 4: Processing Payment...');
    
    // Process payment (cash)
    const paymentResponse = await axios.post(`${BASE_URL}/payments`, {
      orderId: order.id,
      paymentMethod: 'cash',
      amount: order.total,
      paymentDetails: {
        cashReceived: order.total,
        change: 0,
        paymentNote: 'Payment on delivery - exact amount'
      }
    }, { headers });
    
    console.log('✅ Payment processed successfully!');
    console.log(`💰 Payment ID: ${paymentResponse.data.data.id}`);
    console.log(`💳 Method: ${paymentResponse.data.data.paymentMethod}`);
    console.log(`💵 Amount: $${paymentResponse.data.data.amount}`);
    
    // Get order details with payment info
    const orderDetailsResponse = await axios.get(`${BASE_URL}/orders/${order.id}`, { headers });
    const finalOrder = orderDetailsResponse.data.data;
    
    console.log('\n📋 FINAL ORDER DETAILS:');
    console.log(`📦 Order: #${finalOrder.orderNumber}`);
    console.log(`👤 Customer: ${finalOrder.User.firstName} ${finalOrder.User.lastName}`);
    console.log(`📍 Status: ${finalOrder.status}`);
    console.log(`💰 Total: $${finalOrder.total}`);
    console.log(`🍽️ Items: ${finalOrder.OrderItems.length} items`);
    
    finalOrder.OrderItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.MenuItem.name} x${item.quantity} - $${item.unitPrice}`);
      if (item.specialInstructions) {
        console.log(`      📝 Note: ${item.specialInstructions}`);
      }
    });
    
    return {
      order: finalOrder,
      customerId: loginResponse.data.data.user.id,
      customerToken
    };
    
  } catch (error) {
    console.error('❌ Error in order test:', error.response?.data || error.message);
    throw error;
  }
}

async function adminLogin() {
  try {
    console.log('\n👑 Step 5: Admin Login...');
    
    const adminResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'nr_bendifallah@esi.dz',
      password: 'admin123456'
    });
    
    const adminToken = adminResponse.data.data.token;
    console.log('✅ Admin logged in successfully');
    
    return adminToken;
  } catch (error) {
    console.error('❌ Admin login error:', error.response?.data || error.message);
    throw error;
  }
}

async function updateOrderStatus(orderId, status, adminToken, driverId = null) {
  try {
    const headers = {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };
    
    const updateData = {
      status: status,
      statusNotes: `Order status updated to ${status} by admin`,
    };
    
    if (driverId) {
      updateData.driverId = driverId;
    }
    
    const response = await axios.put(`${BASE_URL}/orders/${orderId}/status`, updateData, { headers });
    
    console.log(`✅ Order status updated to: ${status}`);
    return response.data.data;
  } catch (error) {
    console.error(`❌ Error updating status to ${status}:`, error.response?.data || error.message);
    throw error;
  }
}

async function getAllNotifications(token) {
  try {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(`${BASE_URL}/notifications`, { headers });
    return response.data.data;
  } catch (error) {
    console.error('❌ Error getting notifications:', error.response?.data || error.message);
    return [];
  }
}

async function main() {
  try {
    console.log('🚀 COMPREHENSIVE ORDER FLOW TEST\n');
    
    // Step 1-4: Customer creates order and payment
    const { order, customerId, customerToken } = await performOrderTest();
    
    // Step 5: Admin login
    const adminToken = await adminLogin();
    
    console.log('\n🔄 Step 6: Order Status Updates...');
    
    // Update order through various statuses
    await updateOrderStatus(order.id, 'confirmed', adminToken);
    await updateOrderStatus(order.id, 'preparing', adminToken);
    await updateOrderStatus(order.id, 'ready', adminToken);
    await updateOrderStatus(order.id, 'assigned', adminToken, 1); // Assign to admin as driver
    await updateOrderStatus(order.id, 'picked_up', adminToken);
    await updateOrderStatus(order.id, 'delivered', adminToken);
    
    console.log('\n📬 Step 7: Getting All Notifications...');
    
    // Get customer notifications
    const customerNotifications = await getAllNotifications(customerToken);
    console.log(`📱 Customer Notifications (${customerNotifications.length} total):`);
    customerNotifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.title}`);
      console.log(`      📝 ${notif.message}`);
      console.log(`      📅 ${new Date(notif.createdAt).toLocaleString()}`);
      console.log(`      👀 Read: ${notif.isRead ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // Get admin notifications
    const adminNotifications = await getAllNotifications(adminToken);
    console.log(`👑 Admin Notifications (${adminNotifications.length} total):`);
    adminNotifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.title}`);
      console.log(`      📝 ${notif.message}`);
      console.log(`      📅 ${new Date(notif.createdAt).toLocaleString()}`);
      console.log(`      👀 Read: ${notif.isRead ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    console.log('🎉 COMPREHENSIVE TEST COMPLETED SUCCESSFULLY!');
    console.log('\n📊 TEST SUMMARY:');
    console.log(`✅ Customer Login: bendifallahrachid@gmail.com`);
    console.log(`✅ Order Created: #${order.orderNumber}`);
    console.log(`✅ Payment Processed: Cash ($${order.total})`);
    console.log(`✅ Order Status: pending → confirmed → preparing → ready → assigned → picked_up → delivered`);
    console.log(`✅ Notifications Generated: ${customerNotifications.length + adminNotifications.length} total`);
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

main();
