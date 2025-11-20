# Razorpay Payment Gateway Integration Guide

## 🎯 What We've Implemented

Your Disha Digital Prints website now has **Razorpay payment gateway** integrated! This means customers can pay using:

- ✅ **UPI** (Google Pay, PhonePe, Paytm, BHIM, etc.)
- ✅ **Credit/Debit Cards** (Visa, Mastercard, RuPay, Amex)
- ✅ **Net Banking** (All major Indian banks)
- ✅ **Wallets** (Paytm, Mobikwik, Freecharge, etc.)
- ✅ **EMI Options** (Credit card EMI)
- ✅ **Pay Later** (LazyPay, SimPL, etc.)

### Key Benefits

✨ **Instant Verification** - No manual checking, automatic payment confirmation  
✨ **Better Conversion** - Professional checkout UI trusted by customers  
✨ **Multiple Options** - Customers choose their preferred payment method  
✨ **Auto-Reconciliation** - All transactions logged in database  
✨ **Refund Support** - Programmatic refund processing  
✨ **Secure** - PCI-DSS compliant, no card details stored on your server

---

## 📋 Setup Steps

### Step 1: Create Razorpay Account

1. **Sign up** at [https://dashboard.razorpay.com/signup](https://dashboard.razorpay.com/signup)
   - Use your business email
   - Verify phone number
   - Complete KYC (takes 1-2 days)

2. **Get API Keys**
   - Go to: [https://dashboard.razorpay.com/app/keys](https://dashboard.razorpay.com/app/keys)
   - You'll see:
     - **Key ID** (public) - starts with `rzp_test_` or `rzp_live_`
     - **Key Secret** (private) - keep this confidential!

3. **Enable Payment Methods**
   - Go to Settings → Configuration → Payment Methods
   - Enable: UPI, Cards, Netbanking, Wallets
   - Set UPI auto-capture to ON

4. **Set up Webhooks** (Important!)
   - Go to: Settings → Webhooks
   - Add webhook URL: `https://yourdomain.com/api/razorpay/webhook`
   - Select events:
     - ✅ `payment.authorized`
     - ✅ `payment.captured`
     - ✅ `payment.failed`
     - ✅ `refund.created`
   - Copy the **Webhook Secret** (you'll need this)

---

### Step 2: Run Database Schema

Execute the Razorpay schema in your Supabase database:

```bash
# File: razorpay-schema.sql
```

**What it creates:**
- ✅ `razorpay_config` - Stores API credentials
- ✅ `razorpay_payments` - Transaction logs
- ✅ `razorpay_webhooks` - Webhook event logs
- ✅ RLS policies for security
- ✅ Helper functions

**How to run:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy entire content of `razorpay-schema.sql`
4. Click "Run"

---

### Step 3: Configure in Admin Settings

1. **Login to Admin Panel**
   - Go to: `https://yourdomain.com/admin-dashboard.html`
   - Login with admin credentials

2. **Navigate to Settings**
   - Click "Settings" in sidebar
   - Click "Razorpay Settings" tab

3. **Enter Razorpay Credentials**
   ```
   Key ID:         rzp_test_XXXXXXXXXXXXXXXXX
   Key Secret:     YOUR_KEY_SECRET_HERE
   Webhook Secret: whsec_XXXXXXXXXXXXX
   
   Mode:           Test (or Live after KYC approval)
   Enabled:        ✓ Yes
   
   Brand Name:     Disha Digital Prints
   Brand Logo:     https://yourdomain.com/logo.png (optional)
   Brand Color:    #1E6CE0
   ```

4. **Test Configuration**
   - Click "Test Razorpay Connection"
   - Should show: ✅ "Razorpay is configured correctly"

5. **Save Settings**
   - Click "Save Razorpay Settings"

---

### Step 4: Test Payment Flow

#### Test Mode (Before Going Live)

**Use Razorpay Test Cards:**

| Card Number | CVV | OTP | Expiry | Result |
|-------------|-----|-----|--------|--------|
| 4111 1111 1111 1111 | 123 | Any | Future | Success |
| 5555 5555 5555 4444 | 123 | Any | Future | Success |
| 4000 0000 0000 0002 | 123 | Any | Future | Failed |

**Test UPI:**
- UPI ID: `success@razorpay`
- Result: Success

**Test Net Banking:**
- Choose any bank
- Click "Success" on test page

#### Testing Steps:

1. **Place a Test Order**
   - Go to: `https://yourdomain.com/order.html`
   - Add products to cart
   - Proceed to checkout
   - Enter delivery address
   - Select "Razorpay - Instant Verification" payment option

2. **Complete Payment**
   - Razorpay checkout modal opens
   - Choose payment method (UPI/Card/Netbanking)
   - Enter test card details (see table above)
   - Complete payment

3. **Verify Success**
   - Should redirect to order confirmation page
   - Order status should be "Confirmed"
   - Payment status should be "Paid"

4. **Check Admin Panel**
   - Go to Admin → Orders
   - See the new order
   - Payment method: "Razorpay"
   - Status: "Confirmed"

5. **Check Database**
   ```sql
   SELECT * FROM razorpay_payments ORDER BY created_at DESC LIMIT 5;
   ```
   - Should see payment record
   - Status: "captured"
   - Payment ID, Order ID populated

---

### Step 5: Go Live (Production)

**Before going live:**
1. ✅ Complete Razorpay KYC verification
2. ✅ Test thoroughly in test mode
3. ✅ Set up webhook endpoint (backend required)
4. ✅ Switch to live API keys

**Steps to go live:**

1. **Complete KYC**
   - Razorpay Dashboard → Account & Settings → KYC
   - Upload:
     - Business PAN card
     - Aadhaar card
     - Business proof (GST/Shop Act/Partnership deed)
     - Bank account details
   - Verification takes 1-2 business days

2. **Get Live API Keys**
   - After KYC approval
   - Go to: Settings → API Keys → Generate Live Keys
   - **Key ID**: starts with `rzp_live_`
   - **Key Secret**: keep secure!

3. **Update Configuration**
   - Admin Settings → Razorpay Settings
   - Replace test keys with live keys
   - Change Mode: Test → Live
   - Save settings

4. **Test with Real Payment**
   - Make a small test order (₹1)
   - Use real card/UPI
   - Verify payment goes through
   - Refund test payment

---

## 🔒 Security Best Practices

### ⚠️ CRITICAL: Signature Verification

**Current Implementation**: Client-side only (NOT SECURE for production!)

**What you MUST do for production:**

1. **Create Backend Webhook Endpoint**
   
   Example (Node.js):
   ```javascript
   const express = require('express');
   const crypto = require('crypto');
   const app = express();
   
   app.post('/api/razorpay/webhook', express.raw({ type: 'application/json' }), (req, res) => {
       const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
       const signature = req.headers['x-razorpay-signature'];
       const payload = req.body.toString();
       
       // Verify signature
       const expectedSignature = crypto
           .createHmac('sha256', webhookSecret)
           .update(payload)
           .digest('hex');
       
       if (signature !== expectedSignature) {
           return res.status(400).json({ error: 'Invalid signature' });
       }
       
       // Process webhook event
       const event = JSON.parse(payload);
       
       if (event.event === 'payment.captured') {
           // Update order status in database
           const paymentId = event.payload.payment.entity.id;
           // Update Supabase...
       }
       
       res.json({ status: 'ok' });
   });
   ```

2. **Store Key Secret Securely**
   - Use Supabase Vault (encrypted storage)
   - Or use environment variables
   - NEVER commit to Git!

3. **Verify Payment on Backend**
   ```javascript
   const Razorpay = require('razorpay');
   const razorpay = new Razorpay({
       key_id: process.env.RAZORPAY_KEY_ID,
       key_secret: process.env.RAZORPAY_KEY_SECRET
   });
   
   // Verify signature
   const isValid = razorpay.utils.verifyPaymentSignature({
       razorpay_order_id: orderId,
       razorpay_payment_id: paymentId,
       razorpay_signature: signature
   });
   ```

### Other Security Measures:

✅ **Use HTTPS** - Always use SSL certificate  
✅ **Rate Limiting** - Prevent abuse  
✅ **IP Whitelisting** - Razorpay webhook IPs only  
✅ **Log Everything** - All webhook events  
✅ **Validate Amounts** - Check payment amount matches order  
✅ **Handle Duplicates** - Prevent double-processing webhooks

---

## 📊 Payment Flow Diagram

```
Customer                     Your Website                   Razorpay
   |                              |                             |
   |-- 1. Click "Pay Now" ------->|                             |
   |                              |                             |
   |                              |-- 2. Create Order --------->|
   |                              |<-- Order ID ---------------<|
   |                              |                             |
   |<- 3. Open Razorpay Modal ----|                             |
   |                              |                             |
   |-- 4. Enter Payment Details ->|                             |
   |                              |-- 5. Process Payment ------>|
   |                              |                             |
   |                              |<-- 6. Payment Status -------<|
   |                              |                             |
   |                              |-- 7. Verify Signature ----->|
   |                              |                             |
   |                              |<-- 8. Verification --------<|
   |                              |                             |
   |                              |-- 9. Update Order DB        |
   |                              |                             |
   |<- 10. Success Page ----------|                             |
   |                              |                             |
   |                              |<-- 11. Webhook (async) -----<|
   |                              |                             |
```

---

## 🛠️ Files Created/Modified

### New Files:
1. **`razorpay-schema.sql`** - Database tables and policies
2. **`src/js/razorpay-service.js`** - Razorpay integration service
3. **`RAZORPAY_SETUP_GUIDE.md`** - This guide

### Modified Files:
1. **`src/checkout-payment.html`** - Added Razorpay payment option
2. **`src/js/checkout-payment.js`** - Added Razorpay payment handling
3. **`src/admin-settings.html`** - Added Razorpay configuration tab
4. **`src/js/admin-settings.js`** - Added Razorpay settings management

---

## 🧪 Testing Checklist

Before going live, test these scenarios:

### Payment Success:
- [ ] UPI payment successful
- [ ] Card payment successful
- [ ] Net banking successful
- [ ] Wallet payment successful
- [ ] Order status updated to "Confirmed"
- [ ] Payment logged in database
- [ ] Customer receives WhatsApp confirmation
- [ ] Admin receives notification

### Payment Failure:
- [ ] Card declined (use test card ending in 0002)
- [ ] UPI timeout
- [ ] Net banking cancelled
- [ ] Order remains "Pending"
- [ ] Customer can retry payment
- [ ] Failure reason logged

### Edge Cases:
- [ ] User closes Razorpay modal
- [ ] Network interruption during payment
- [ ] Duplicate payment attempts
- [ ] Invalid order ID
- [ ] Amount mismatch
- [ ] Signature verification fails

### Admin Panel:
- [ ] Payment listed in Orders page
- [ ] Payment details visible
- [ ] Refund can be initiated (if needed)
- [ ] Transaction ID searchable

---

## 💰 Razorpay Pricing

**Transaction Fees (India):**
- **Domestic Cards**: 2% + GST
- **UPI**: 2% + GST (or fixed fee for high volume)
- **Net Banking**: 2% + GST
- **Wallets**: 2% + GST
- **International Cards**: 3% + GST

**Settlement:**
- T+2 days (Standard)
- T+0 available for extra fee

**No Setup Fees**: ₹0
**No Annual Fees**: ₹0
**No Maintenance**: ₹0

---

## 🔄 Refund Process

### Admin-Initiated Refund:

1. **In Admin Panel**
   - Go to: Orders → Click Order
   - Click "Initiate Refund"
   - Enter refund amount (partial or full)
   - Add reason
   - Confirm

2. **Backend API Call** (you need to implement):
   ```javascript
   const refund = await razorpay.payments.refund(paymentId, {
       amount: refundAmount * 100, // in paise
       speed: 'normal', // or 'optimum'
       notes: { reason: 'Customer request' }
   });
   ```

3. **Processing Time**:
   - Normal: 5-7 business days
   - Optimum: Instant (extra charges apply)

4. **Update Database**:
   - Update `razorpay_payments` table
   - Set `refund_status` = 'full' or 'partial'
   - Set `refund_amount`
   - Set `refund_id`

---

## 🆘 Troubleshooting

### Problem: Razorpay option not showing

**Solution:**
1. Check admin settings are saved
2. Verify `enabled` = true in database:
   ```sql
   SELECT * FROM razorpay_config;
   ```
3. Check browser console for errors
4. Ensure `razorpay-service.js` is loaded

---

### Problem: Payment successful but order not confirmed

**Solution:**
1. Check `razorpay_payments` table:
   ```sql
   SELECT * FROM razorpay_payments 
   WHERE razorpay_payment_id = 'pay_XXXXXX';
   ```
2. Check order status update logic
3. Verify webhook is configured
4. Check webhook logs:
   ```sql
   SELECT * FROM razorpay_webhooks 
   WHERE processed = false;
   ```

---

### Problem: Signature verification failed

**Solution:**
1. **DO NOT IGNORE THIS** - it's a security issue
2. Verify Key Secret is correct
3. Implement backend verification
4. Check webhook secret matches
5. Log the exact error:
   ```javascript
   console.error('Signature mismatch:', {
       expected: expectedSignature,
       received: signature
   });
   ```

---

### Problem: Test mode working, live mode not

**Solution:**
1. Verify KYC is approved
2. Check live API keys are correct
3. Ensure Mode = 'live' in settings
4. Clear browser cache
5. Test with real payment (₹1)
6. Contact Razorpay support if issue persists

---

## 📞 Support & Resources

### Razorpay Support:
- **Email**: support@razorpay.com
- **Phone**: +91-80-47182181
- **Docs**: https://razorpay.com/docs
- **API Reference**: https://razorpay.com/docs/api

### Testing Resources:
- **Test Cards**: https://razorpay.com/docs/payments/payments/test-card-details
- **Test UPI**: https://razorpay.com/docs/payments/payments/test-upi-details
- **Webhooks Guide**: https://razorpay.com/docs/webhooks

### Code Examples:
- **GitHub**: https://github.com/razorpay
- **SDKs**: Node.js, Python, PHP, Java, Ruby, .NET

---

## ✅ Next Steps

1. **Immediate** (Can do now):
   - [ ] Create Razorpay account
   - [ ] Run database schema
   - [ ] Configure in admin settings
   - [ ] Test in test mode

2. **Before Going Live** (Required):
   - [ ] Complete KYC verification
   - [ ] Implement backend webhook endpoint
   - [ ] Implement signature verification on backend
   - [ ] Store Key Secret securely (Supabase Vault)
   - [ ] Test all payment methods
   - [ ] Test refund process

3. **Production Launch**:
   - [ ] Switch to live API keys
   - [ ] Monitor first few transactions
   - [ ] Set up automated reconciliation
   - [ ] Enable auto-refunds (optional)

4. **Optional Enhancements**:
   - [ ] Add EMI options
   - [ ] Add international cards
   - [ ] Implement subscription billing
   - [ ] Add payment links (for phone orders)
   - [ ] Integrate Razorpay Route (split payments)

---

## 📝 Summary

**What's Working Now:**
✅ Razorpay payment option on checkout page  
✅ Multiple payment methods (UPI, Cards, Netbanking, Wallets)  
✅ Payment logging in database  
✅ Order auto-confirmation on successful payment  
✅ Admin settings for Razorpay configuration  
✅ Test mode ready

**What You Need to Do:**
1. Create Razorpay account and get API keys
2. Run database schema in Supabase
3. Configure settings in admin panel
4. Test thoroughly in test mode
5. Implement backend webhook endpoint (before production)
6. Complete KYC and go live

**Production-Ready Status:** 🟡 **80% Complete**
- ✅ Frontend integration done
- ✅ Database schema ready
- ✅ Admin configuration UI ready
- ⚠️ Backend webhook endpoint needed (for security)
- ⚠️ Signature verification needs backend implementation

---

**Need Help?**
- Check Razorpay documentation: https://razorpay.com/docs
- Contact me for implementation guidance
- Reach out to Razorpay support for account issues

**Ready to accept payments! 🎉**
