const { createTransporter } = require('../config/email');
const {
  welcomeEmail,
  orderConfirmationEmail,
  orderStatusEmail,
  passwordResetEmail
} = require('../templates/email/emailTemplates');

class EmailService {
  constructor() {
    this.transporter = createTransporter();
  }

  // Send email utility method
  async sendEmail(to, subject, html, text) {
    try {
      if (!process.env.EMAIL_USER) {
        console.warn('⚠️ Email service not configured - skipping email send');
        return { success: false, message: 'Email service not configured' };
      }

      const mailOptions = {
        from: {
          name: 'FUDO Food Delivery',
          address: process.env.EMAIL_USER
        },
        to,
        subject,
        html,
        text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${to}: ${subject}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send email verification email
  async sendEmailVerificationEmail(user, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
    
    const template = {
      subject: '📧 Verify Your Email - FUDO Food Delivery',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">🍕 FUDO Food Delivery</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">Hi ${user.firstName}!</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #555;">
              Thank you for registering with FUDO Food Delivery! 🎉
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #555;">
              To complete your registration and start ordering delicious food, please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold;
                        display: inline-block;">
                ✅ Verify My Email
              </a>
            </div>
            
            <p style="font-size: 14px; color: #888; line-height: 1.6;">
              Or copy and paste this link in your browser:<br>
              <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
            </p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                ⚠️ <strong>Important:</strong> This verification link will expire in 24 hours. If you didn't create an account, please ignore this email.
              </p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #555;">
              Once verified, you'll be able to:
            </p>
            <ul style="color: #555; font-size: 16px; line-height: 1.6;">
              <li>🛒 Browse our delicious menu</li>
              <li>📱 Place orders easily</li>
              <li>🚚 Track your deliveries in real-time</li>
              <li>⭐ Rate and review your meals</li>
            </ul>
            
            <p style="font-size: 16px; line-height: 1.6; color: #555;">
              Welcome to the FUDO family! 🍽️
            </p>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">© 2024 FUDO Food Delivery. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">Questions? Contact us at support@fudo.com</p>
          </div>
        </div>
      `,
      text: `
        Hi ${user.firstName}!
        
        Thank you for registering with FUDO Food Delivery!
        
        To complete your registration, please verify your email address by visiting:
        ${verificationUrl}
        
        This verification link will expire in 24 hours.
        
        Welcome to the FUDO family!
        
        © 2024 FUDO Food Delivery
      `
    };

    return await this.sendEmail(
      user.email,
      template.subject,
      template.html,
      template.text
    );
  }

  // Send welcome email to new users
  async sendWelcomeEmail(user) {
    const template = welcomeEmail(user);
    return await this.sendEmail(
      user.email,
      template.subject,
      template.html,
      template.text
    );
  }

  // Send order confirmation email
  async sendOrderConfirmationEmail(user, order) {
    const template = orderConfirmationEmail(user, order);
    return await this.sendEmail(
      user.email,
      template.subject,
      template.html,
      template.text
    );
  }

  // Send order status update email
  async sendOrderStatusEmail(user, order, oldStatus, newStatus) {
    // Only send email for significant status changes
    const significantChanges = [
      'confirmed',
      'preparing',
      'out_for_delivery',
      'delivered',
      'cancelled'
    ];

    if (significantChanges.includes(newStatus)) {
      const template = orderStatusEmail(user, order, oldStatus, newStatus);
      return await this.sendEmail(
        user.email,
        template.subject,
        template.html,
        template.text
      );
    }

    return { success: true, message: 'Status change not significant enough for email' };
  }

  // Send password reset email
  async sendPasswordResetEmail(user, resetToken) {
    const template = passwordResetEmail(user, resetToken);
    return await this.sendEmail(
      user.email,
      template.subject,
      template.html,
      template.text
    );
  }

  // Send staff notification email (for internal communications)
  async sendStaffNotificationEmail(staffEmail, subject, message, orderDetails = null) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #007bff; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🔔 Staff Notification</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">${subject}</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">${message}</p>
          
          ${orderDetails ? `
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #007bff; margin-top: 0;">Order Details</h3>
              <p><strong>Order ID:</strong> #${orderDetails.id}</p>
              <p><strong>Customer:</strong> ${orderDetails.customer}</p>
              <p><strong>Total:</strong> $${orderDetails.totalAmount}</p>
              <p><strong>Status:</strong> ${orderDetails.status}</p>
            </div>
          ` : ''}
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            This is an automated notification from FUDO Food Delivery System.
          </p>
        </div>
      </div>
    `;

    const text = `
      Staff Notification: ${subject}
      
      ${message}
      
      ${orderDetails ? `
      Order Details:
      - Order ID: #${orderDetails.id}
      - Customer: ${orderDetails.customer}
      - Total: $${orderDetails.totalAmount}
      - Status: ${orderDetails.status}
      ` : ''}
      
      This is an automated notification from FUDO Food Delivery System.
    `;

    return await this.sendEmail(staffEmail, `🔔 ${subject}`, html, text);
  }

  // Send bulk emails (for promotions, announcements)
  async sendBulkEmail(recipients, subject, htmlContent, textContent) {
    const results = [];
    
    for (const recipient of recipients) {
      const result = await this.sendEmail(
        recipient.email,
        subject,
        htmlContent.replace(/{{firstName}}/g, recipient.firstName || 'Valued Customer'),
        textContent.replace(/{{firstName}}/g, recipient.firstName || 'Valued Customer')
      );
      
      results.push({
        email: recipient.email,
        success: result.success,
        error: result.error || null
      });

      // Add delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  // Send test email (for configuration testing)
  async sendTestEmail(testEmail) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #28a745; padding: 20px; text-align: center; border-radius: 10px;">
          <h1 style="color: white; margin: 0;">✅ Email Test Successful!</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border: 1px solid #ddd; margin-top: 20px; border-radius: 10px;">
          <p style="color: #666; font-size: 16px;">
            Congratulations! Your FUDO email service is configured correctly and working as expected.
          </p>
          
          <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #155724;">
              <strong>✅ Test completed successfully at:</strong><br>
              ${new Date().toLocaleString()}
            </p>
          </div>
          
          <p style="color: #999; font-size: 14px;">
            You can now send emails to your customers for orders, notifications, and more.
          </p>
        </div>
      </div>
    `;

    const text = `
      Email Test Successful!
      
      Congratulations! Your FUDO email service is configured correctly and working as expected.
      
      Test completed at: ${new Date().toLocaleString()}
      
      You can now send emails to your customers for orders, notifications, and more.
    `;

    return await this.sendEmail(
      testEmail,
      '✅ FUDO Email Service Test',
      html,
      text
    );
  }
}

module.exports = new EmailService();
