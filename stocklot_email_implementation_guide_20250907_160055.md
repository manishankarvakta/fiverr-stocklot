# StockLot Email System Implementation Guide

Generated: 2025-09-07 16:00:55

## 📧 System Overview

This guide covers the implementation of StockLot's comprehensive email notification system with 65 email templates across 18 categories.

## 🚀 Quick Start

### 1. Backend Integration
```python
from services.email_notification_service import EmailNotificationService, EmailNotification

# Initialize service
email_service = EmailNotificationService(db)

# Send welcome email
await email_service.send_welcome_email(
    user_email="user@example.com",
    first_name="John",
    verify_url="https://stocklot.farm/verify/abc123"
)
```

### 2. Environment Variables Required
```bash
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=stocklot.farm
```

### 3. Template Structure
- Base template: `/app/backend/templates/email/base.html`
- Individual templates: `/app/backend/templates/email/e01.html`, `e02.html`, etc.
- Variables use Handlebars syntax: `{variable_name}`

## 📋 Template Categories

### Transactional (Cannot Unsubscribe)
- `transactional.auth` - Authentication & verification
- `transactional.kyc` - KYC verification process
- `transactional.orders` - Order processing
- `transactional.payments` - Payment & escrow
- `security` - Security alerts
- `compliance` - Regulatory compliance

### Marketing (Can Unsubscribe)
- `engagement` - User engagement
- `auctions` - Auction notifications
- `reviews` - Review system
- `lifecycle` - Product lifecycle

## 🔧 API Endpoints

### User Preferences
- `GET /api/email-preferences/{user_id}` - Get user preferences
- `PUT /api/email-preferences/{user_id}` - Update preferences
- `POST /api/email-preferences/{user_id}/unsubscribe` - Unsubscribe

### Admin Management
- `GET /api/email-templates/catalog` - Get template catalog
- `POST /api/email-notifications/send` - Send test emails
- `GET /api/admin/email-stats` - System statistics

## 📊 Template Statistics

- **Total Templates**: 65
- **Transactional**: 65
- **Marketing**: 0
- **High Priority**: 34

## 🎨 Email Design System

### Colors
- Primary: #22c55e (Green)
- Secondary: #64748b (Slate)
- Success: #10b981 (Emerald)
- Warning: #f59e0b (Amber)
- Error: #dc2626 (Red)

### Typography
- Font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
- Headers: 24px, font-weight: 600
- Body: 16px, line-height: 1.6

### Components
- `.button` - Primary action buttons
- `.info-box` - Information containers
- `.livestock-card` - Livestock specification cards
- `.spec-grid` - Specification display grid

## 📱 Mobile Responsive
- Max width: 600px
- Mobile breakpoint: @media (max-width: 600px)
- Touch-friendly buttons: min 44px height
- Readable text: min 16px font size

## 🔐 Compliance Features

### GDPR Compliance
- Explicit consent for marketing emails
- Easy unsubscribe mechanism
- Data retention policies
- Privacy policy links

### CAN-SPAM Compliance
- Clear sender identification
- Accurate subject lines
- Physical address in footer
- Honor opt-out requests within 10 days

### Categories that NEVER allow unsubscribe:
- Authentication & security
- Transaction confirmations
- Legal/compliance notices
- System alerts

## 🧪 Testing Checklist

- [ ] Template rendering with all variables
- [ ] Mobile responsive design
- [ ] Dark mode compatibility
- [ ] Unsubscribe link functionality
- [ ] Mailgun delivery tracking
- [ ] Bounce/complaint handling
- [ ] Template caching performance

## 📈 Monitoring & Analytics

### Key Metrics
- Open rates by template
- Click rates by category
- Unsubscribe rates
- Bounce rates
- Complaint rates

### Mailgun Webhooks
Monitor delivery events:
- `delivered` - Successful delivery
- `failed` - Permanent failure
- `bounced` - Temporary failure
- `complained` - Spam complaint
- `unsubscribed` - User unsubscribed

## 🚨 Error Handling

### Graceful Degradation
- Email failures don't block core functionality
- Fallback to basic HTML templates if Jinja2 fails
- Queue failed emails for retry
- Log all email errors for monitoring

### Retry Strategy
- Immediate retry for network errors
- Exponential backoff for rate limits
- Skip retry for permanent failures (bounces)
- Maximum 3 retry attempts

## 💾 Database Schema

### Email Preferences Collection
```javascript
{
  user_id: "string",
  email: "string",
  engagement: "subscribed|unsubscribed|paused",
  marketing: "subscribed|unsubscribed|paused",
  // ... other categories
  updated_at: "datetime",
  created_at: "datetime"
}
```

### Email Suppressions Collection
```javascript
{
  email: "string",
  reason: "bounce|complaint|unsubscribe",
  suppressed_at: "datetime",
  active: "boolean"
}
```

## 🔄 Maintenance Tasks

### Daily
- Monitor delivery rates
- Check for bounces/complaints
- Review error logs

### Weekly
- Update suppression lists
- Analyze engagement metrics
- Test template rendering

### Monthly
- Review unsubscribe rates
- Update email content
- Performance optimization

---

## 📞 Support

For implementation questions:
- Technical: backend team
- Design: frontend team  
- Content: marketing team
- Compliance: legal team

Generated from StockLot Email Notification Service v1.0
