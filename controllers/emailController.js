const emailService = require('../services/emailService');
const { testEmailConnection } = require('../config/email');
const { User } = require('../models');

// Test email configuration
const testEmailConfig = async (req, res) => {
  try {
    const isConnected = await testEmailConnection();
    
    if (isConnected) {
      res.json({
        success: true,
        message: 'Email service is configured correctly'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Email service configuration failed'
      });
    }
  } catch (error) {
    console.error('Error testing email config:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing email configuration'
    });
  }
};

// Send test email
const sendTestEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const result = await emailService.sendTestEmail(email);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending test email'
    });
  }
};

// Send bulk promotional email (Admin only)
const sendBulkEmail = async (req, res) => {
  try {
    const { subject, htmlContent, textContent, recipientType = 'all' } = req.body;
    
    if (!subject || !htmlContent || !textContent) {
      return res.status(400).json({
        success: false,
        message: 'Subject, HTML content, and text content are required'
      });
    }

    // Get recipients based on type
    let whereCondition = { isActive: true };
    
    if (recipientType === 'customers') {
      whereCondition.role = 'customer';
    } else if (recipientType === 'staff') {
      whereCondition.role = 'staff';
    }

    const recipients = await User.findAll({
      where: whereCondition,
      attributes: ['email', 'firstName']
    });

    if (recipients.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No recipients found'
      });
    }

    const results = await emailService.sendBulkEmail(
      recipients,
      subject,
      htmlContent,
      textContent
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Bulk email sent successfully`,
      stats: {
        totalRecipients: recipients.length,
        successCount,
        failureCount,
        results: results
      }
    });
  } catch (error) {
    console.error('Error sending bulk email:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending bulk email'
    });
  }
};

// Send staff notification
const sendStaffNotification = async (req, res) => {
  try {
    const { staffEmail, subject, message, orderDetails } = req.body;
    
    if (!staffEmail || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Staff email, subject, and message are required'
      });
    }

    const result = await emailService.sendStaffNotificationEmail(
      staffEmail,
      subject,
      message,
      orderDetails
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Staff notification sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send staff notification',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending staff notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending staff notification'
    });
  }
};

// Get email service status
const getEmailStatus = async (req, res) => {
  try {
    const isConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
    const isConnected = await testEmailConnection();
    
    res.json({
      success: true,
      data: {
        configured: isConfigured,
        connected: isConnected,
        service: process.env.EMAIL_SERVICE || 'gmail',
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        user: process.env.EMAIL_USER ? process.env.EMAIL_USER.replace(/(.{3}).*(@.*)/, '$1***$2') : 'Not configured'
      }
    });
  } catch (error) {
    console.error('Error getting email status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting email service status'
    });
  }
};

module.exports = {
  testEmailConfig,
  sendTestEmail,
  sendBulkEmail,
  sendStaffNotification,
  getEmailStatus
};
