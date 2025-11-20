# 🧪 Complete Testing Checklist

## ✅ Authentication Flow Testing

### Landing Page
- [ ] Open `http://localhost:8000/src/index.html`
- [ ] Verify "Sign In / Sign Up" button visible in header
- [ ] Verify "Sign In / Sign Up" link in footer
- [ ] Click "Sign In / Sign Up" → Should go to login.html

### Browse as Guest (No Login)
- [ ] Browse products without login
- [ ] Click any "Order Now" button
- [ ] Configure product (documents/business-cards/brochures)
- [ ] Click "Add to Cart"
- [ ] See cart badge update with item count
- [ ] Click cart icon → Should go to cart.html
- [ ] See all cart items displayed correctly

### Cart Page → Login Prompt
- [ ] On cart.html with items
- [ ] Click "Proceed to Checkout" button
- [ ] **Expected:** Confirm dialog appears: "Please login to proceed"
- [ ] Click "OK"
- [ ] **Expected:** Redirected to login.html with return URL

### Login Page - Phone OTP Flow
- [ ] On login.html
- [ ] See "Login with WhatsApp OTP" heading
- [ ] Enter phone: `9876543210` (or any valid Indian number)
- [ ] Enter name: `Test User`
- [ ] Click "Send OTP via WhatsApp"
- [ ] **Expected:** 
  - Phone input step hides
  - OTP input step shows
  - OTP appears in browser console (F12)
  - Alert shows OTP (development fallback)
  - 6 OTP input boxes appear
  - Message shows: "OTP sent to +91 9876543210"
- [ ] Enter the 6-digit OTP from console/alert
- [ ] Click "Verify OTP"
- [ ] **Expected:**
  - Success message: "Login successful!"
  - Redirected to checkout-address.html

### Checkout Address Page
- [ ] On checkout-address.html after login
- [ ] See order summary on right sidebar
- [ ] Fill delivery address form:
  - Full Name: `John Doe`
  - Phone: `9876543210`
  - Email: `john@example.com`
  - Address Line 1: `123 Main Street`
  - Address Line 2: `Apartment 4B` (optional)
  - City: `Mumbai`
  - State: `Maharashtra`
  - Pincode: `400001`
  - Landmark: `Near City Mall` (optional)
- [ ] Select delivery method: Delivery / Store Pickup
- [ ] Click "Proceed to Payment"
- [ ] **Expected:** Redirected to checkout-payment.html

### Checkout Payment Page
- [ ] On checkout-payment.html
- [ ] See order summary
- [ ] See delivery address displayed
- [ ] See payment options:
  - UPI (with QR code)
  - Cash on Delivery
  - Store Pickup
- [ ] Select payment method
- [ ] Complete payment flow
- [ ] **Expected:** Order confirmation page

---

## ✅ Direct URL Access Protection

### Test Without Login
- [ ] Clear localStorage: `localStorage.clear()`
- [ ] Clear sessionStorage: `sessionStorage.clear()`
- [ ] Access `http://localhost:8000/src/checkout-address.html` directly
- [ ] **Expected:** 
  - Alert: "Please login to continue with checkout"
  - Redirected to login.html
- [ ] Access `http://localhost:8000/src/checkout-payment.html` directly
- [ ] **Expected:**
  - Alert: "Please login to complete your order"
  - Redirected to login.html

### Test With Login But No Address
- [ ] Login first (complete OTP flow)
- [ ] Clear session storage: `sessionStorage.clear()`
- [ ] Access `http://localhost:8000/src/checkout-payment.html` directly
- [ ] **Expected:**
  - Alert: "Please provide delivery address before payment"
  - Redirected to checkout-address.html

---

## ✅ Header Navigation

### Guest User Header
- [ ] Logout or clear localStorage
- [ ] Refresh any page
- [ ] **Expected Header:**
  - "Home" link
  - "Browse Products" link
  - "Track Order" link
  - Cart icon with badge
  - "Login" button (blue, prominent)

### Logged In User Header
- [ ] Login with phone OTP
- [ ] Refresh any page
- [ ] **Expected Header:**
  - "New Order" link
  - "My Orders" link
  - "Track Order" link
  - Cart icon with badge
  - User dropdown with name
- [ ] Click user dropdown
- [ ] **Expected:**
  - Name and phone number displayed
  - "My Account" option
  - "My Orders" option
  - "Settings" option
  - "Logout" button (red)

---

## ✅ Admin Dashboard

### Promote to Admin
- [ ] Login as regular user
- [ ] Open browser console (F12)
- [ ] Type: `AUTH.makeAdmin()`
- [ ] Press Enter
- [ ] **Expected:**
  - Page reloads
  - Header shows "Activity Log" link
  - User dropdown shows "Admin" badge

### Access Admin Dashboard
- [ ] As admin, click "Activity Log" in header
- [ ] **Expected:**
  - admin-activity.html loads
  - See statistics: Total Users, Active Today, Cart Abandonments, Orders
  - See activity feed with recent actions
  - See filters: Search, Action Type, Time Range
  - "Export" and "Refresh" buttons visible

### Test Admin Dashboard Features
- [ ] Search by phone number
- [ ] Filter by action type (Login, Cart, Orders, etc.)
- [ ] Filter by time (Today, Last 7 Days, Last 30 Days)
- [ ] Click "Export" → CSV file downloads
- [ ] Click "Refresh" → Dashboard updates
- [ ] See activity details (timestamp, user, action)

---

## ✅ Activity Tracking

### Test Activity Logging
- [ ] Login with phone OTP
- [ ] **Expected:** "logged in" activity recorded
- [ ] Browse to different pages
- [ ] **Expected:** Page view activities recorded
- [ ] Add item to cart
- [ ] **Expected:** "Added to cart" activity recorded
- [ ] Remove item from cart
- [ ] **Expected:** "Removed from cart" activity recorded

### View Activities
- [ ] Open console (F12)
- [ ] Type: `JSON.parse(localStorage.getItem('adminActivities'))`
- [ ] **Expected:** Array of activity objects with timestamps

---

## ✅ Cart Functionality

### Add Items
- [ ] Go to order.html
- [ ] Select "A4 Documents"
- [ ] Configure: 100 pages, Black & White
- [ ] Click "Add to Cart"
- [ ] **Expected:**
  - Success toast appears
  - Cart badge shows "1"
- [ ] Select "Business Cards"
- [ ] Configure: 100 cards, Standard paper
- [ ] Click "Add to Cart"
- [ ] **Expected:** Cart badge shows "2"

### View Cart
- [ ] Click cart icon
- [ ] **Expected:**
  - All 2 items displayed
  - Each item shows product name, quantity, price
  - Can adjust quantity (+/-)
  - Can remove items
  - Order summary shows subtotal, GST, delivery, total

### Modify Cart
- [ ] Increase quantity of first item
- [ ] **Expected:** Price recalculates instantly
- [ ] Decrease quantity
- [ ] **Expected:** Price updates
- [ ] Click "Remove" on item
- [ ] **Expected:** Confirmation dialog
- [ ] Confirm removal
- [ ] **Expected:** Item removed, summary updates

---

## ✅ Return URL Flow

### Test Return After Login
- [ ] As guest, add items to cart
- [ ] Go to cart.html
- [ ] Click "Proceed to Checkout"
- [ ] Login with OTP
- [ ] **Expected:** 
  - After login, automatically redirected to checkout-address.html
  - Cart items still present
  - Can continue checkout flow

---

## ✅ Session Persistence

### Test Page Reload
- [ ] Login with phone OTP
- [ ] Add items to cart
- [ ] Refresh browser (F5)
- [ ] **Expected:**
  - Still logged in
  - Cart items still present
  - Header shows logged-in state

### Test Browser Close/Reopen
- [ ] Login with phone OTP
- [ ] Close browser completely
- [ ] Reopen browser
- [ ] Go to site
- [ ] **Expected:**
  - Still logged in (localStorage persists)
  - Header shows logged-in state
  - Cart is empty (sessionStorage cleared)

---

## ✅ Logout Flow

### Test Logout
- [ ] Login first
- [ ] Click user dropdown in header
- [ ] Click "Logout"
- [ ] **Expected:**
  - Confirmation dialog: "Are you sure?"
  - After confirming, redirected to index.html
  - Header shows guest state (Login button)
  - Cart cleared
  - All session data cleared

---

## ✅ Mobile Responsiveness

### Test Mobile View
- [ ] Open DevTools (F12)
- [ ] Toggle device toolbar (Ctrl+Shift+M)
- [ ] Select iPhone or Android device
- [ ] **Expected:**
  - Mobile menu button visible
  - Navigation collapses to hamburger menu
  - Cart still functional
  - Login form responsive
  - Checkout forms readable and usable

---

## ✅ Error Handling

### Empty Cart Checkout
- [ ] Clear cart (remove all items)
- [ ] Try to click "Proceed to Checkout"
- [ ] **Expected:** Error toast: "Your cart is empty"

### Invalid Phone Number
- [ ] On login.html
- [ ] Enter invalid phone: `1234567890` (starts with 1)
- [ ] **Expected:** Error message about invalid format

### Wrong OTP
- [ ] Send OTP
- [ ] Enter wrong 6-digit code
- [ ] **Expected:** Error: "Invalid OTP"

### Direct Admin Access (Non-Admin)
- [ ] Login as regular user
- [ ] Access `admin-activity.html` directly
- [ ] **Expected:**
  - Alert: "Access denied. Admin only"
  - Redirected to index.html

---

## ✅ WhatsApp Integration (If Configured)

### Test Real WhatsApp OTP
- [ ] Configure whatsapp-service.js with real credentials
- [ ] Login with your real WhatsApp number
- [ ] **Expected:**
  - OTP sent to your WhatsApp
  - Receive message with 6-digit code
  - No console.log or alert (production mode)

### Test Admin Notifications
- [ ] Login and browse products
- [ ] **Expected:** Admin receives WhatsApp notification
- [ ] Add item to cart
- [ ] **Expected:** Admin receives activity notification

---

## 🐛 Known Issues to Check

- [ ] OTP auto-expire after 10 minutes (not implemented)
- [ ] Rate limiting on OTP requests (not implemented)
- [ ] Multiple device login handling (not implemented)
- [ ] Accessibility (screen readers, keyboard navigation)
- [ ] Browser compatibility (Chrome, Firefox, Safari, Edge)

---

## 📊 Success Criteria

**All tests should pass:**
- ✅ Guest users can browse and cart
- ✅ Login required for checkout
- ✅ Phone OTP verification works
- ✅ Address mandatory before payment
- ✅ Direct URL access protected
- ✅ Return URL flow working
- ✅ Admin dashboard accessible
- ✅ Activity tracking functional
- ✅ Session persists correctly
- ✅ Logout clears all data

---

## 🚀 Ready for Production?

### Development Complete ✅
- Authentication flow
- Checkout protection
- Activity logging
- Admin dashboard

### Still Needed for Production ⚠️
- Server-side OTP generation
- Database integration
- WhatsApp API backend proxy
- Session token management
- Rate limiting
- Error monitoring
- Analytics integration

---

## Quick Test Commands

```javascript
// Check auth status
AUTH.getUser()

// Make admin
AUTH.makeAdmin()

// View cart
JSON.parse(sessionStorage.getItem('cart'))

// View activities
JSON.parse(localStorage.getItem('adminActivities'))

// Full reset
localStorage.clear(); sessionStorage.clear(); location.reload();
```

---

**Happy Testing!** 🎉
