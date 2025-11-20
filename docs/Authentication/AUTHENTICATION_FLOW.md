# Authentication Flow - Complete User Journey

## Overview
Complete authentication and checkout flow for Disha Digital Prints with phone OTP verification and mandatory address collection.

---

## Flow Diagram

```
Landing Page (index.html)
    |
    ├─→ Browse Products (Guest - No login required)
    |
    ├─→ Add to Cart (Guest - No login required)
    |
    └─→ View Cart (cart.html)
         |
         ├─→ Click "Proceed to Checkout"
         |    |
         |    └─→ Check Authentication
         |         |
         |         ├─→ NOT LOGGED IN
         |         |    |
         |         |    └─→ Redirect to login.html?return=checkout-address.html
         |         |         |
         |         |         └─→ Login Page (login.html)
         |         |              |
         |         |              ├─→ Enter Phone Number (+91)
         |         |              ├─→ Enter Name
         |         |              ├─→ Send OTP via WhatsApp
         |         |              ├─→ Enter 6-digit OTP
         |         |              ├─→ Verify OTP
         |         |              └─→ Session Created ✓
         |         |                   |
         |         |                   └─→ Redirect to checkout-address.html
         |         |
         |         └─→ LOGGED IN ✓
         |              |
         |              └─→ Proceed to Address Page
         |
         └─→ Checkout Address (checkout-address.html)
              |
              ├─→ Check Authentication (Required)
              |    |
              |    └─→ If NOT logged in → Redirect to login.html
              |
              ├─→ Fill Delivery Address Form
              |    ├─→ Name
              |    ├─→ Phone
              |    ├─→ Email
              |    ├─→ Address Line 1
              |    ├─→ Address Line 2 (Optional)
              |    ├─→ City
              |    ├─→ State
              |    ├─→ Pincode
              |    └─→ Landmark (Optional)
              |
              ├─→ Save Address to sessionStorage
              |
              └─→ Click "Proceed to Payment"
                   |
                   └─→ Checkout Payment (checkout-payment.html)
                        |
                        ├─→ Check Authentication (Required)
                        |    |
                        |    └─→ If NOT logged in → Redirect to login.html
                        |
                        ├─→ Validate Delivery Info (Required)
                        |    |
                        |    └─→ If NO address → Redirect to checkout-address.html
                        |
                        ├─→ Select Payment Method
                        |    ├─→ UPI (QR Code)
                        |    ├─→ Cash on Delivery
                        |    └─→ Store Pickup
                        |
                        ├─→ Complete Payment
                        |
                        └─→ Order Confirmation (order-confirmation.html)
                             |
                             └─→ Order Placed Successfully ✓
```

---

## Authentication States

### 1. Guest User (Not Logged In)
- Can browse products
- Can add items to cart
- Can view cart
- **CANNOT** proceed to checkout
- **CANNOT** access my orders
- **CANNOT** access admin dashboard

### 2. Logged In User (Phone Verified)
- All guest permissions +
- Can proceed to checkout
- Can view my orders
- Can save addresses
- Can track orders
- Can manage profile

### 3. Admin User
- All logged in user permissions +
- Can view admin activity dashboard
- Can see all customer activities
- Can send follow-up messages
- Can export activity logs

---

## Required Data at Each Stage

### Stage 1: Cart (No Authentication Required)
**Data Stored:** sessionStorage
```javascript
{
  cart: [
    {
      product: "documents",
      productName: "A4 Document Printing",
      quantity: 100,
      total: 200.00,
      pricing: {
        subtotal: 190.48,
        gst: 9.52,
        grandTotal: 200.00
      }
    }
  ]
}
```

### Stage 2: Login (Creates User Session)
**Data Stored:** localStorage
```javascript
{
  userSession: {
    phone: "9876543210",
    name: "John Doe",
    role: "user", // or "admin"
    loggedIn: true,
    phoneVerified: true,
    verifiedAt: "2024-01-01T00:00:00.000Z"
  }
}
```

### Stage 3: Address (Requires Authentication)
**Data Stored:** sessionStorage
```javascript
{
  deliveryInfo: {
    name: "John Doe",
    phone: "9876543210",
    email: "john@example.com",
    address: "123 Main Street",
    address2: "Apartment 4B",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    landmark: "Near City Mall",
    deliveryMethod: "delivery", // or "pickup"
    gstNumber: "", // Optional for businesses
    gstCompanyName: "" // Optional
  }
}
```

### Stage 4: Payment (Requires Authentication + Address)
**Validates:**
- User session exists (localStorage.userSession)
- Phone verified (userSession.phoneVerified === true)
- Delivery info exists (sessionStorage.deliveryInfo)
- Address is complete (name, address, city, state, pincode)

---

## Authentication Checks Implementation

### 1. Cart Page (cart.js)
```javascript
// When clicking "Proceed to Checkout"
const user = JSON.parse(localStorage.getItem('userSession') || '{}');

if (!user.phoneVerified || !user.loggedIn) {
    if (confirm('Please login to proceed with checkout')) {
        window.location.href = 'login.html?return=checkout-address.html';
    }
    return;
}

// Proceed to address page
window.location.href = 'checkout-address.html';
```

### 2. Checkout Address Page (checkout-address.js)
```javascript
function checkAuthentication() {
    const user = JSON.parse(localStorage.getItem('userSession') || '{}');
    
    if (!user.phoneVerified || !user.loggedIn) {
        alert('Please login to continue with checkout');
        window.location.href = `login.html?return=${encodeURIComponent(window.location.pathname)}`;
        return false;
    }
    
    return true;
}

// Called on DOMContentLoaded
if (!checkAuthentication()) {
    return; // Stops page initialization
}
```

### 3. Checkout Payment Page (checkout-payment.js)
```javascript
function checkAuthentication() {
    const user = JSON.parse(localStorage.getItem('userSession') || '{}');
    
    if (!user.phoneVerified || !user.loggedIn) {
        alert('Please login to complete your order');
        window.location.href = 'login.html?return=checkout-address.html';
        return false;
    }
    
    return true;
}

function validateDeliveryInfo() {
    const deliveryInfo = JSON.parse(sessionStorage.getItem('deliveryInfo') || '{}');
    
    if (!deliveryInfo || !deliveryInfo.name || !deliveryInfo.address) {
        alert('Please provide delivery address before payment');
        window.location.href = 'checkout-address.html';
        return false;
    }
    
    return true;
}

// Called on DOMContentLoaded
if (!checkAuthentication() || !validateDeliveryInfo()) {
    return; // Stops page initialization
}
```

---

## Login Flow (Phone OTP Verification)

### Step 1: Phone Number Entry
1. User opens `login.html`
2. Enters phone number (10 digits, starts with 6-9)
3. Enters full name
4. Clicks "Send OTP via WhatsApp"

### Step 2: OTP Generation & Sending
1. System generates 6-digit OTP (100000-999999)
2. OTP sent via WhatsApp Business API (if configured)
3. Fallback: OTP shown in console.log and alert (development)
4. OTP stored temporarily in JavaScript

### Step 3: OTP Verification
1. User enters 6-digit OTP
2. System verifies entered OTP matches generated OTP
3. If correct:
   - Create user session in localStorage
   - Set phoneVerified = true
   - Log login activity
   - Redirect to return URL or default page
4. If incorrect:
   - Show error message
   - Allow retry

### Step 4: Session Management
- Session stored in `localStorage.userSession`
- Persists across page reloads
- Cleared on logout
- Used for authentication checks throughout site

---

## Return URL Handling

### How Return URLs Work
```
User Flow:
1. User on cart.html
2. Clicks "Proceed to Checkout"
3. Not logged in
4. Redirected to: login.html?return=checkout-address.html
5. After successful login
6. Redirected to: checkout-address.html
7. User continues checkout flow
```

### Implementation
```javascript
// In login.js after successful OTP verification
const returnUrl = new URLSearchParams(window.location.search).get('return') || 'order.html';
window.location.href = returnUrl;
```

---

## Testing the Flow

### Test Scenario 1: Guest User Trying to Checkout
1. Open `http://localhost:8000/src/index.html`
2. Click any "Order Now" button
3. Configure product options
4. Click "Add to Cart"
5. Click cart icon → View cart
6. Click "Proceed to Checkout"
7. **Expected:** Login prompt appears
8. Click OK
9. **Expected:** Redirected to login.html
10. Enter phone: 9876543210
11. Enter name: Test User
12. Click "Send OTP via WhatsApp"
13. **Expected:** OTP appears in console (F12) and alert
14. Enter the OTP
15. Click "Verify OTP"
16. **Expected:** Redirected to checkout-address.html
17. Fill address form
18. Click "Proceed to Payment"
19. **Expected:** Reaches payment page successfully

### Test Scenario 2: Logged In User Checkout
1. Already logged in (from Scenario 1)
2. Go to cart page
3. Click "Proceed to Checkout"
4. **Expected:** Goes directly to address page (no login prompt)
5. Address pre-filled if saved earlier
6. Click "Proceed to Payment"
7. **Expected:** Reaches payment page immediately

### Test Scenario 3: Direct URL Access Protection
1. **Without Login:**
   - Access `checkout-address.html` directly
   - **Expected:** Redirected to login.html
   - Access `checkout-payment.html` directly
   - **Expected:** Redirected to login.html

2. **With Login but No Address:**
   - Login first
   - Access `checkout-payment.html` directly
   - **Expected:** Redirected to checkout-address.html

### Test Scenario 4: Admin Access
1. Login as regular user
2. Open console (F12)
3. Type: `AUTH.makeAdmin()`
4. **Expected:** User role changed to admin
5. **Expected:** Header shows "Activity Log" link
6. Click "Activity Log"
7. **Expected:** Admin dashboard loads
8. **Expected:** See all user activities

---

## Error Handling

### 1. No Cart Items
- **Where:** cart.html → Proceed to Checkout
- **Error:** "Your cart is empty"
- **Action:** Prevent checkout, stay on cart page

### 2. Not Logged In
- **Where:** Any checkout page
- **Error:** "Please login to continue with checkout"
- **Action:** Redirect to login.html with return URL

### 3. No Delivery Address
- **Where:** checkout-payment.html
- **Error:** "Please provide delivery address before payment"
- **Action:** Redirect to checkout-address.html

### 4. Invalid Phone Number
- **Where:** login.html
- **Error:** "Please enter valid 10-digit mobile number"
- **Action:** Highlight phone field, prevent OTP send

### 5. Wrong OTP
- **Where:** login.html OTP verification
- **Error:** "Invalid OTP. Please try again"
- **Action:** Clear OTP inputs, allow retry

### 6. Admin Page Access (Non-Admin)
- **Where:** admin-activity.html
- **Error:** "Access denied. Admin only"
- **Action:** Redirect to index.html

---

## Session Storage vs Local Storage

### Local Storage (Persistent)
- `userSession` - User authentication data
- `adminActivities` - Activity log (last 100)
- `savedAddresses` - Saved delivery addresses

### Session Storage (Cleared on Browser Close)
- `cart` - Shopping cart items
- `deliveryInfo` - Current order delivery info
- `checkoutData` - Temporary checkout data

---

## Security Considerations

### Current Implementation (Development)
- ✅ OTP generated client-side
- ✅ OTP verification client-side
- ✅ Session stored in localStorage
- ❌ No server-side validation
- ❌ No OTP expiry (use timer in production)
- ❌ WhatsApp API tokens in JavaScript

### Production Recommendations
1. **Move OTP to Backend:**
   - Generate OTP on server
   - Store in database with expiry (10 minutes)
   - Verify against database
   - Rate limit OTP requests (3 attempts)

2. **Secure WhatsApp API:**
   - Store access token in environment variables
   - Never expose in client-side code
   - Use server-side proxy for WhatsApp calls

3. **Session Management:**
   - Use JWT tokens
   - Store tokens in httpOnly cookies
   - Set expiration times
   - Implement refresh tokens

4. **Address Validation:**
   - Validate pincode against database
   - Verify phone number format server-side
   - Sanitize all inputs
   - Prevent SQL injection

---

## Quick Commands (Console)

```javascript
// Check if logged in
AUTH.getUser()

// Make current user admin
AUTH.makeAdmin()

// Logout
AUTH.logout()

// View cart
JSON.parse(sessionStorage.getItem('cart'))

// View delivery info
JSON.parse(sessionStorage.getItem('deliveryInfo'))

// View all activities
JSON.parse(localStorage.getItem('adminActivities'))

// Clear all data
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## Files Modified

### Core Authentication
- ✅ `src/login.html` - Phone OTP login page
- ✅ `src/js/login.js` - Login logic and OTP verification
- ✅ `src/js/auth-utils.js` - Authentication helper functions
- ✅ `src/js/whatsapp-service.js` - WhatsApp API and activity logging

### Checkout Flow
- ✅ `src/cart.html` - Shopping cart with auth check
- ✅ `src/js/cart.js` - Cart logic with login requirement
- ✅ `src/checkout-address.html` - Address form (protected)
- ✅ `src/js/checkout-address.js` - Address validation with auth check
- ✅ `src/checkout-payment.html` - Payment page (protected)
- ✅ `src/js/checkout-payment.js` - Payment logic with auth + address validation

### Landing & Navigation
- ✅ `src/index.html` - Updated "Sign In / Sign Up" buttons
- ✅ `src/js/header-auth.js` - Authentication-aware header

### Admin
- ✅ `src/admin-activity.html` - Activity monitoring dashboard
- ✅ `src/js/admin-dashboard.js` - Dashboard logic

---

## Summary

**Complete authentication flow implemented:**
1. ✅ Landing page has "Sign In / Sign Up" links
2. ✅ Users can browse and add to cart without login
3. ✅ Login required to proceed to checkout
4. ✅ Phone OTP verification via WhatsApp
5. ✅ Address collection mandatory before payment
6. ✅ Payment page validates both auth + address
7. ✅ Session persists across page reloads
8. ✅ Return URL handling for seamless flow
9. ✅ Admin dashboard for activity monitoring
10. ✅ Activity logging for all user actions

**Ready for testing!** 🚀
