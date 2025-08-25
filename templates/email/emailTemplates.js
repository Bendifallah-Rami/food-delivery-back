// Welcome email template
const welcomeEmail = (user) => {
  return {
    subject: '� Welcome to FUDO! You\'re all set!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 32px;">🍕 Welcome to FUDO!</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">Your food adventure starts now! 🚀</p>
        </div>
        
        <div style="background-color: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0; font-size: 24px;">Hey ${user.firstName}! 👋</h2>
          
          <p style="color: #666; font-size: 18px; line-height: 1.6; margin: 20px 0;">
            🎉 <strong>Congratulations!</strong> Your FUDO account is ready and you're already logged in! 
            No verification needed - we keep things simple! 😊
          </p>
          
          <div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 25px; border-radius: 12px; margin: 25px 0;">
            <h3 style="color: #d4671e; margin-top: 0; font-size: 20px;">🚀 You can now:</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 15px;">
              <div style="flex: 1; min-width: 200px;">
                <p style="color: #d4671e; line-height: 1.8; margin: 5px 0; font-size: 16px;">
                  🍔 Browse our delicious menu<br>
                  📍 Add your delivery address<br>
                  🛒 Place orders instantly<br>
                  📱 Track deliveries in real-time
                </p>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 18px 40px; 
                      text-decoration: none; 
                      border-radius: 30px; 
                      font-weight: bold; 
                      font-size: 18px;
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              🍕 Start Ordering Now!
            </a>
          </div>
          
          <div style="background: #e8f5e8; border: 1px solid #4caf50; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; color: #2e7d32; font-size: 16px; text-align: center;">
              💡 <strong>Pro Tip:</strong> Download our mobile app for even faster ordering!
            </p>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px; line-height: 1.6;">
            Questions? We're here to help! 💬<br>
            📧 support@fudo.com | 📞 1-800-FUDO-HELP
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p style="margin: 0;">© 2024 FUDO Food Delivery. Made with ❤️ for food lovers!</p>
        </div>
      </div>
    `,
    text: `
      🎉 Welcome to FUDO, ${user.firstName}!
      
      Your account is ready and you're already logged in! No verification needed - we keep things simple! 😊
      
      You can now:
      🍔 Browse our delicious menu
      📍 Add your delivery address  
      🛒 Place orders instantly
      📱 Track deliveries in real-time
      
      Start ordering: ${process.env.FRONTEND_URL || 'http://localhost:3000'}
      
      Questions? Contact us at support@fudo.com
      
      Questions? Contact us at support@fudo.com
      
      © 2024 FUDO Food Delivery
    `
  };
};

// Order confirmation email template
const orderConfirmationEmail = (user, order) => {
  const itemsHtml = order.orderItems.map(item => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 10px; color: #333;">${item.MenuItem?.name || 'Unknown Item'}</td>
      <td style="padding: 10px; text-align: center; color: #666;">${item.quantity}</td>
      <td style="padding: 10px; text-align: right; color: #333;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return {
    subject: `🎉 Order Confirmed - #${order.id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #28a745; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Order Confirmed!</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hi ${user.firstName}!</h2>
          
          <p style="color: #666; font-size: 16px;">
            Your order has been confirmed and is being prepared. Here are the details:
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #28a745; margin-top: 0;">📋 Order Details</h3>
            <p style="margin: 5px 0;"><strong>Order ID:</strong> #${order.id}</p>
            <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${order.status}</p>
            <p style="margin: 5px 0;"><strong>Total:</strong> $${order.totalAmount}</p>
          </div>
          
          <h3 style="color: #333;">🛒 Items Ordered</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 12px; text-align: left; color: #333; border-bottom: 2px solid #dee2e6;">Item</th>
                <th style="padding: 12px; text-align: center; color: #333; border-bottom: 2px solid #dee2e6;">Qty</th>
                <th style="padding: 12px; text-align: right; color: #333; border-bottom: 2px solid #dee2e6;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">
              <strong>⏱️ Estimated Delivery:</strong> ${order.estimatedDeliveryTime || '30-45 minutes'}
            </p>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            Track your order status at ${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders
          </p>
        </div>
      </div>
    `,
    text: `
      Order Confirmed - #${order.id}
      
      Hi ${user.firstName}!
      
      Your order has been confirmed and is being prepared.
      
      Order Details:
      - Order ID: #${order.id}
      - Order Date: ${new Date(order.createdAt).toLocaleDateString()}
      - Status: ${order.status}
      - Total: $${order.totalAmount}
      
      Items Ordered:
      ${order.orderItems.map(item => `- ${item.MenuItem?.name || 'Unknown Item'} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`).join('\n')}
      
      Estimated Delivery: ${order.estimatedDeliveryTime || '30-45 minutes'}
      
      Track your order at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders
    `
  };
};

// Order status update email template
const orderStatusEmail = (user, order, oldStatus, newStatus) => {
  const statusMessages = {
    pending: { emoji: '⏳', message: 'Your order is pending confirmation.' },
    confirmed: { emoji: '✅', message: 'Your order has been confirmed and is being prepared.' },
    preparing: { emoji: '👨‍🍳', message: 'Our kitchen team is preparing your delicious meal.' },
    ready: { emoji: '📦', message: 'Your order is ready and waiting for pickup by our delivery team.' },
    out_for_delivery: { emoji: '🚗', message: 'Your order is on its way to you!' },
    delivered: { emoji: '🎉', message: 'Your order has been delivered successfully. Enjoy your meal!' },
    cancelled: { emoji: '❌', message: 'Your order has been cancelled.' }
  };

  const statusInfo = statusMessages[newStatus] || { emoji: '📝', message: 'Your order status has been updated.' };

  return {
    subject: `${statusInfo.emoji} Order #${order.id} - ${newStatus.replace('_', ' ').toUpperCase()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #17a2b8; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${statusInfo.emoji} Order Update</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hi ${user.firstName}!</h2>
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="color: #1976d2; margin: 0 0 10px 0;">Order #${order.id}</h3>
            <p style="color: #424242; font-size: 18px; margin: 0;">${statusInfo.message}</p>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin: 25px 0;">
            <div style="text-align: center; flex: 1;">
              <div style="color: ${oldStatus === newStatus ? '#ccc' : '#28a745'}; font-size: 14px; font-weight: bold;">Previous Status</div>
              <div style="color: #666; margin-top: 5px;">${oldStatus.replace('_', ' ').toUpperCase()}</div>
            </div>
            <div style="text-align: center; margin: 0 20px;">
              <div style="color: #17a2b8; font-size: 24px;">→</div>
            </div>
            <div style="text-align: center; flex: 1;">
              <div style="color: #28a745; font-size: 14px; font-weight: bold;">Current Status</div>
              <div style="color: #333; margin-top: 5px; font-weight: bold;">${newStatus.replace('_', ' ').toUpperCase()}</div>
            </div>
          </div>
          
          ${newStatus === 'out_for_delivery' ? `
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404;">
                <strong>🚗 Your delivery is on the way!</strong><br>
                Our delivery partner will contact you when they arrive.
              </p>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${order.id}" 
               style="background-color: #17a2b8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Track Order 📱
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            Questions? Contact us at support@fudo.com
          </p>
        </div>
      </div>
    `,
    text: `
      Order Update - #${order.id}
      
      Hi ${user.firstName}!
      
      ${statusInfo.message}
      
      Order Status: ${oldStatus.replace('_', ' ').toUpperCase()} → ${newStatus.replace('_', ' ').toUpperCase()}
      
      Track your order at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${order.id}
      
      Questions? Contact us at support@fudo.com
    `
  };
};

// Password reset email template
const passwordResetEmail = (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
   
  return {
    subject: '🔑 Reset Your FUDO Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #dc3545; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔑 Password Reset</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hi ${user.firstName}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            We received a request to reset your password for your FUDO account. If you didn't make this request, you can safely ignore this email.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #666; margin: 0; text-align: center;">
              Click the button below to reset your password:
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Reset Password 🔐
            </a>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>⚠️ Security Note:</strong> This reset link will expire in 10 minutes for your security.
            </p>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            If the button doesn't work, copy and paste this link:<br>
            <a href="${resetUrl}" style="color: #007bff; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
      </div>
    `,
    text: `
      Password Reset - FUDO
      
      Hi ${user.firstName}!
      
      We received a request to reset your password for your FUDO account.
      
      Reset your password by visiting: ${resetUrl}
      
      This link will expire in 10 minutes for your security.
      
      If you didn't request this reset, you can safely ignore this email.
    `
  };
};

module.exports = {
  welcomeEmail,
  orderConfirmationEmail,
  orderStatusEmail,
  passwordResetEmail
};
