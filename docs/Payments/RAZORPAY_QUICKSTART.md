# Razorpay Integration - Quick Start Guide

## 🚀 Get Started in 15 Minutes

Follow these steps to activate Razorpay payment gateway on your website.

---

## Step 1: Create Razorpay Account (5 minutes)

1. Go to: https://dashboard.razorpay.com/signup
2. Sign up with your email
3. Verify phone number
4. Complete business details
5. **Skip KYC for now** (we'll use test mode)

---

## Step 2: Get Test API Keys (2 minutes)

1. Login to Razorpay Dashboard
2. Go to: **Settings → API Keys** (https://dashboard.razorpay.com/app/keys)
3. Click **"Generate Test Keys"**
4. You'll see:
   - **Key ID**: `rzp_test_XXXXXXXXXXXXX` (copy this)
   - **Key Secret**: Click to reveal, then copy

---

## Step 3: Setup Database (3 minutes)

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Open the file: `razorpay-schema.sql`
4. Copy **entire content**
5. Paste in SQL Editor
6. Click **"Run"**
7. Wait for "Success" message

---

## Step 4: Configure in Admin Panel (3 minutes)

1. Go to your admin panel: `https://yourdomain.com/admin-dashboard.html`
2. Click **"Settings"** in sidebar
3. Click **"Razorpay Gateway"** tab
4. Fill in:
   ```
   ✓ Enable Razorpay Gateway: ON
   
   Key ID: rzp_test_XXXXXXXXXXXXX (paste from Step 2)
   Key Secret: YOUR_KEY_SECRET (paste from Step 2)
   
   Mode: Test
   
   Brand Name: Disha Digital Prints
   Brand Color: #1E6CE0 (or choose your color)
   ```
5. Click **"Test Razorpay Connection"**
6. Should show: ✅ "Connected!"
7. Click **"Save Settings"**

---

## Step 5: Test Payment (2 minutes)

1. **Open your website** in incognito/private window
2. **Add product to cart**
3. **Proceed to checkout**
4. **Enter delivery address**
5. **Select payment method:** "Razorpay - Instant Verification"
6. **Click "Place Order"**

You'll see Razorpay checkout modal!

### Test with these cards:

**✅ Success Card:**
```
Card: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25 (any future date)
OTP: Any 6 digits
```

**❌ Failed Card:**
```
Card: 4000 0000 0000 0002
CVV: 123
Expiry: 12/25
```

**UPI (Success):**
```
UPI ID: success@razorpay
```

---

## ✅ Verification Checklist

After test payment:
- [ ] Payment modal opened
- [ ] Payment was successful
- [ ] Redirected to order confirmation page
- [ ] Order status shows "Confirmed"
- [ ] Payment listed in Admin → Orders
- [ ] WhatsApp notification received

---

## 🎉 You're Done!

Razorpay is now active in **test mode**. Customers won't see real charges.

---

## Next Steps

### To Go Live (When Ready):

1. **Complete KYC** in Razorpay Dashboard
   - Takes 1-2 business days
   - Submit: PAN, Aadhaar, Business proof, Bank details

2. **Get Live Keys**
   - After KYC approval
   - Go to: Settings → API Keys → Generate Live Keys

3. **Update in Admin Settings**
   - Replace test keys with live keys
   - Change Mode: Test → Live
   - Save settings

4. **Test with Real Payment**
   - Make ₹1 test order
   - Use real card/UPI
   - Verify it works
   - Refund if needed

---

## 🆘 Having Issues?

### Razorpay option not showing?
- Check "Enable Razorpay Gateway" is ON
- Verify settings are saved
- Refresh the checkout page

### Payment modal not opening?
- Check browser console for errors (F12)
- Verify Key ID is correct
- Check internet connection

### Test payment failing?
- Use exact test card numbers above
- Try different card (success vs failed)
- Check Razorpay Dashboard → Payments for details

### Need more help?
- Read: `RAZORPAY_SETUP_GUIDE.md` (detailed guide)
- Read: `RAZORPAY_IMPLEMENTATION.md` (technical details)
- Contact: support@razorpay.com

---

## 📚 Additional Resources

- **Test Cards List**: https://razorpay.com/docs/payments/payments/test-card-details
- **Razorpay Docs**: https://razorpay.com/docs
- **Dashboard**: https://dashboard.razorpay.com
- **KYC Guide**: https://razorpay.com/docs/kyc

---

**That's it! You're now accepting online payments! 🎉**
