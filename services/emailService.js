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
