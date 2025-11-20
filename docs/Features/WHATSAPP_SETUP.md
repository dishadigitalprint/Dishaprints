# WhatsApp Business API Setup Guide

This guide will help you set up WhatsApp Business API for Disha Digital Prints to enable OTP verification and admin notifications.

## Overview

The system uses **WhatsApp Business Platform (Cloud API)** which provides:
- 1,000 free conversations per month
- Template-based messaging for OTP and notifications
- No hosting required (cloud-based)

## Prerequisites

- Facebook/Meta Account
- Business phone number (will be your WhatsApp Business number)
- Business verification documents (optional but recommended)

---

## Step 1: Create Meta Business Account

1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Click **Create Account**
3. Fill in your business details:
   - Business Name: `Disha Digital Prints`
   - Business Email: Your business email
   - Business Details: Digital printing services
4. Complete email verification

---

## Step 2: Set Up WhatsApp Business

### 2.1 Add WhatsApp Product

1. In Meta Business Suite, go to **Settings** → **Business Assets**
2. Click **Accounts** → **WhatsApp Accounts**
3. Click **Add** → **Create a WhatsApp Business Account**
4. Fill in:
   - Display Name: `Disha Digital Prints`
   - Category: `Business and Utility`
   - Description: `Digital printing services`

### 2.2 Register Phone Number

1. Under your WhatsApp Business Account, click **Add phone number**
2. Choose **Use your own phone number** (NOT personal WhatsApp)
3. Enter your business phone number (e.g., `+91 98765 43210`)
4. Select verification method:
   - **Voice Call**: Automated call with code
   - **SMS**: Text message with code (recommended)
5. Enter the 6-digit verification code
6. Accept WhatsApp Business Terms

### 2.3 Get Your Credentials

Once phone number is verified:

1. Go to **WhatsApp** → **API Setup** in Meta Business Suite
2. You'll see:
   - **Phone Number ID**: Copy this (looks like `123456789012345`)
   - **WhatsApp Business Account ID**: Copy this too
3. Note these down - you'll need them!

---

## Step 3: Generate Access Token

### 3.1 Create System User (Permanent Access)

1. Go to **Business Settings** → **Users** → **System Users**
2. Click **Add** → Create system user:
   - Name: `Disha WhatsApp API`
   - Role: `Admin`
3. Click on the system user you just created
4. Click **Add Assets** → Select **WhatsApp Accounts**
5. Select your WhatsApp Business Account
6. Enable **Manage WhatsApp Business Account**

### 3.2 Generate Token

1. Under the system user, click **Generate New Token**
2. Select your WhatsApp Business Account
3. Select permissions:
   - ✅ `whatsapp_business_messaging`
   - ✅ `whatsapp_business_management`
4. Token expires: Select **Never** (for permanent token)
5. Click **Generate Token**
6. **IMPORTANT**: Copy the token immediately and save it securely!
   - Format: `EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - This is your `ACCESS_TOKEN`

---

## Step 4: Create Message Templates

WhatsApp requires pre-approved templates for business-initiated messages.

### 4.1 OTP Verification Template

1. Go to **WhatsApp** → **Message Templates**
2. Click **Create Template**
3. Fill in:
   - **Name**: `otp_verification`
   - **Category**: `Authentication`
   - **Language**: `English`
4. Message body:
   ```
   Your OTP for Disha Digital Prints is {{1}}. Valid for 10 minutes. Do not share this code.
   ```
5. Add sample value for {{1}}: `123456`
6. Click **Submit**
7. Wait for approval (usually 15 minutes - 24 hours)

### 4.2 Order Confirmation Template

1. Create another template
2. Fill in:
   - **Name**: `order_confirmation`
   - **Category**: `Order Status`
   - **Language**: `English`
3. Message body:
   ```
   Thank you for your order at Disha Digital Prints!
   
   Order ID: {{1}}
   Amount: ₹{{2}}
   Items: {{3}}
   
   We'll notify you when your order is ready.
   ```
4. Add sample values:
   - {{1}}: `DDP123456`
   - {{2}}: `500`
   - {{3}}: `2 items`
5. Click **Submit**

### 4.3 Template Approval

- Check template status in **Message Templates** section
- Status changes: `Pending` → `Approved` or `Rejected`
- If rejected, read rejection reason and modify template
- You can start development with templates in `Pending` status

---

## Step 5: Configure the Application

### 5.1 Update whatsapp-service.js

Open `src/js/whatsapp-service.js` and update the configuration:

```javascript
// Configuration
const config = {
    phoneNumberId: '123456789012345',  // From Step 2.3
    accessToken: 'EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',  // From Step 3.2
    apiUrl: 'https://graph.facebook.com/v18.0',
    businessPhoneNumber: '+919876543210',  // Your registered number
    adminPhoneNumber: '+919876543210'  // Admin's WhatsApp number for notifications
};
```

### 5.2 Verify Template Names

Make sure template names match exactly:
- `otp_verification` (for OTP messages)
- `order_confirmation` (for order updates)

### 5.3 Test Configuration

Open browser console on the login page and run:
```javascript
// Test phone number formatting
whatsappService.formatPhoneNumber('9876543210');
// Should return: "+919876543210"

// Test OTP generation
whatsappService.generateOTP();
// Should return: 6-digit number like "123456"
```

---

## Step 6: Testing

### 6.1 Test OTP Flow

1. Open `http://localhost:8000/src/login.html`
2. Enter your test phone number (registered on WhatsApp)
3. Enter any name
4. Click **Send OTP via WhatsApp**
5. Check:
   - ✅ WhatsApp message received on your phone
   - ✅ OTP displayed in browser console (for testing)
   - ✅ Alert shows OTP if WhatsApp fails (fallback)

### 6.2 Test Admin Notifications

1. Complete login
2. Browse products and add to cart
3. Check admin WhatsApp for activity notifications:
   - Login notification
   - "Viewing page" notifications
   - "Added to cart" notifications

### 6.3 Test Cart Abandonment

1. Add items to cart
2. Go to checkout address page
3. Leave page idle for 5 minutes
4. Admin should receive "Cart abandoned" notification

### 6.4 Verify Logs

Check browser console for:
```
✅ OTP sent successfully
✅ Admin notified
✅ Activity logged
```

---

## Step 7: Production Deployment

### 7.1 Security Checklist

- [ ] Remove all `console.log()` statements showing OTP
- [ ] Remove `alert()` fallback for OTP display
- [ ] Store `ACCESS_TOKEN` securely (environment variable)
- [ ] Never commit `ACCESS_TOKEN` to git
- [ ] Enable HTTPS for your website
- [ ] Add rate limiting for OTP requests

### 7.2 Monitoring

- Monitor message quota: 1,000 free conversations/month
- Check **WhatsApp Manager** → **Insights** for usage
- Set up alerts when approaching quota limit
- Plan for paid tier if exceeding free quota

### 7.3 Webhook Setup (Optional)

For two-way communication (receiving replies):

1. Go to **WhatsApp** → **Configuration**
2. Set webhook URL: `https://yourdomain.com/webhook`
3. Verify token: Create a secret token
4. Subscribe to webhook events:
   - Messages
   - Message status
   - Message templates

---

## Common Issues & Solutions

### Issue 1: "Phone number not registered"

**Solution**: Verify phone number in WhatsApp Business setup

### Issue 2: "Template not found"

**Solution**: Wait for template approval or check template name spelling

### Issue 3: "Access token expired"

**Solution**: Generate new permanent token with "Never" expiry

### Issue 4: "Message failed to send"

**Solution**: 
- Check phone number format (+91 for India)
- Verify recipient has WhatsApp installed
- Check message quota hasn't been exceeded

### Issue 5: "Template rejected"

**Solution**: 
- Avoid promotional content in authentication templates
- Use clear, simple language
- Follow WhatsApp template guidelines

---

## Rate Limits & Quotas

### Free Tier Limits
- **1,000 conversations/month** (initiated by business)
- Each conversation = 24-hour messaging window
- User-initiated messages don't count toward quota

### Conversation Calculation
- Login OTP = 1 conversation
- Multiple messages in 24 hours = Same conversation
- Admin notifications = Separate conversations

### Upgrading
- Once you exceed 1,000/month, Meta will suggest paid tier
- Paid tier: Pay per conversation ($0.005 - $0.09 depending on region)

---

## Additional Resources

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Message Template Guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines)
- [Cloud API Quick Start](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Pricing Information](https://developers.facebook.com/docs/whatsapp/pricing)

---

## Support

For issues specific to this integration:
- Check browser console for error messages
- Verify all credentials are correctly configured
- Test with Meta's API Explorer tool
- Contact Meta Business Support for WhatsApp API issues

---

## Next Steps

After successful setup:

1. ✅ Test OTP login flow end-to-end
2. ✅ Verify admin notifications working
3. ✅ Test cart abandonment tracking
4. ✅ Create admin dashboard to view activities
5. ✅ Add order status notifications (Processing, Ready, Delivered)
6. ✅ Implement payment confirmation messages
7. ✅ Set up daily order summary for admin

---

## Quick Reference

**Files to Configure:**
- `src/js/whatsapp-service.js` - Main configuration

**Required Templates:**
- `otp_verification` - For login OTP
- `order_confirmation` - For order updates

**Admin Pages:**
- `src/admin-activity.html` - View user activities
- Protected by admin role check

**Testing Login:**
```bash
# Start server
cd c:\ai\Disha\dishaPrints\src
python -m http.server 8000

# Open in browser
http://localhost:8000/login.html
```

**Make Current User Admin (Console):**
```javascript
AUTH.makeAdmin();
```

---

**Setup Complete!** 🎉

Your WhatsApp Business API integration is ready. Users can now login with phone OTP verification, and you'll receive real-time activity notifications.
