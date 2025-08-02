# FUDO Email Notification System 📧

## Overview
The FUDO Food Delivery System includes a comprehensive email notification service built with Nodemailer. This service handles automated emails for user registration, order confirmations, status updates, and administrative communications.

## Features ✨

### 🎯 **Automated Email Types**
- **Welcome Emails** - Sent automatically when users register
- **Order Confirmations** - Sent when orders are placed
- **Order Status Updates** - Sent when order status changes
- **Password Reset** - Secure password reset links
- **Staff Notifications** - Internal team communications
- **Bulk Emails** - Promotional campaigns and announcements

### 🛡️ **Security & Features**
- HTML and plain text email templates
- Responsive email design
- Rate limiting protection
- Admin-only bulk email access
- Automatic error handling
- Asynchronous email sending (non-blocking)

## Configuration ⚙️

### Environment Variables (.env)
```bash
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Gmail Setup
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the generated password in `EMAIL_PASSWORD`

## API Endpoints 🚀

### Admin-Only Routes (Require Authentication + Admin Role)

#### Get Email Service Status
```
GET /api/email/status
```
Returns configuration status and connection health.

#### Test Email Configuration
```
GET /api/email/test-config
```
Tests SMTP connection without sending emails.

#### Send Test Email
```
POST /api/email/test
Body: { "email": "test@example.com" }
```
Sends a test email to verify configuration.

#### Send Bulk Email
```
POST /api/email/bulk
Body: {
  "subject": "Promotion Title",
  "recipientType": "customers", // "customers", "staff", or "all"
  "htmlContent": "<h1>HTML content with {{firstName}} placeholder</h1>",
  "textContent": "Plain text with {{firstName}} placeholder"
}
```

#### Send Staff Notification
```
POST /api/email/staff-notification
Body: {
  "staffEmail": "staff@example.com",
  "subject": "Important Notice",
  "message": "Your message here",
  "orderDetails": { // Optional
    "id": 123,
    "customer": "John Doe",
    "totalAmount": "25.99",
    "status": "preparing"
  }
}
```

## Email Templates 📋

### Available Templates
1. **Welcome Email** - Colorful onboarding email with CTA buttons
2. **Order Confirmation** - Detailed order summary with items and pricing
3. **Order Status Update** - Progress tracking with visual status indicators
4. **Password Reset** - Secure reset link with expiration notice
5. **Staff Notifications** - Professional internal communications

### Template Features
- 📱 Mobile-responsive design
- 🎨 FUDO brand colors (#ff6b35 primary)
- 🔗 Dynamic frontend URL integration
- 📊 Order details tables
- ⏱️ Timestamp tracking
- 🛡️ Security indicators

## Integration Examples 💡

### Automatic Welcome Email (Already Integrated)
```javascript
// In authController.js - registration function
emailService.sendWelcomeEmail(newUser).catch(err => {
    console.error('Failed to send welcome email:', err);
});
```

### Order Confirmation Email
```javascript
// When order is created
const user = await User.findByPk(order.userId);
emailService.sendOrderConfirmationEmail(user, order);
```

### Order Status Update Email
```javascript
// When order status changes
const user = await User.findByPk(order.userId);
emailService.sendOrderStatusEmail(user, order, oldStatus, newStatus);
```

## Testing 🧪

### Test Email Service
1. Start the server: `npm start`
2. Login as admin
3. Test endpoints:
   ```bash
   # Check status
   GET /api/email/status
   
   # Send test email
   POST /api/email/test
   { "email": "your-test@email.com" }
   ```

### Test Welcome Email
1. Register a new user
2. Check server logs for email confirmation
3. Check the recipient's inbox

## Email Logs 📊

The system logs all email activities:
- ✅ Successful sends with message IDs
- ❌ Failed attempts with error details
- ⚠️ Configuration warnings
- 📧 Recipient and subject tracking

## Production Considerations 🚀

1. **Email Provider**: Consider professional services like:
   - SendGrid
   - AWS SES
   - Mailgun
   - Postmark

2. **Rate Limiting**: Built-in delays between bulk emails

3. **Error Handling**: Graceful failures don't block user operations

4. **Security**: 
   - App passwords for Gmail
   - Environment variable protection
   - HTTPS in production

## Troubleshooting 🔧

### Common Issues
1. **Gmail Authentication**: Use App Password, not regular password
2. **Firewall**: Ensure port 587 is open
3. **2FA**: Enable 2-Factor Authentication on Gmail
4. **Rate Limits**: Gmail has sending limits for free accounts

### Error Messages
- "Invalid login": Check EMAIL_USER and EMAIL_PASSWORD
- "Connection timeout": Check EMAIL_HOST and EMAIL_PORT
- "Authentication failed": Use App Password for Gmail

## Future Enhancements 🔮

- [ ] Email templates editor in admin dashboard
- [ ] Email analytics and tracking
- [ ] SMS notifications integration
- [ ] Push notifications
- [ ] Email scheduling
- [ ] A/B testing for email campaigns
- [ ] Unsubscribe management
- [ ] Email bounce handling

---

**Ready to use!** 🎉 The email system is fully configured and integrated with your FUDO food delivery backend.
