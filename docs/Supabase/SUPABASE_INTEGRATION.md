# 🚀 Supabase Integration Guide

## Step 1: Get Your Credentials

1. Go to your Supabase project: https://supabase.com/dashboard/project/noerqtwbyqeunjvnzlmg
2. Click **Settings** → **API**
3. Copy these values:

```javascript
Project URL: https://noerqtwbyqeunjvnzlmg.supabase.co
Anon/Public Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (keep secret!)
```

---

## Step 2: Create Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase-schema.sql`
4. Paste into the SQL editor
5. Click **Run** (bottom right)
6. Wait for completion (should take 5-10 seconds)

✅ **Expected result:** "Success. No rows returned"

This creates:
- ✅ 8 tables (users, otp_verification, addresses, orders, etc.)
- ✅ Indexes for fast queries
- ✅ Functions and triggers
- ✅ Row Level Security (RLS) policies
- ✅ Views for reporting

---

## Step 3: Verify Tables Created

1. Go to **Table Editor** in Supabase
2. You should see these tables:
   - `users`
   - `otp_verification`
   - `addresses`
   - `orders`
   - `order_items`
   - `activity_log`
   - `cart_abandonment`
   - `whatsapp_messages`

---

## Step 4: Install Supabase Client

```powershell
cd c:\ai\Disha\dishaPrints\src
```

Add this script tag to your HTML files (or create a separate config file):

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

---

## Step 5: Create Supabase Configuration File

Create `src/js/supabase-config.js`:

```javascript
/**
 * Supabase Configuration
 */

const SUPABASE_URL = 'https://noerqtwbyqeunjvnzlmg.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE'; // Replace with your actual key

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test connection
async function testSupabaseConnection() {
    try {
        const { data, error } = await supabase.from('users').select('count');
        if (error) throw error;
        console.log('✅ Supabase connected successfully!');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection failed:', error.message);
        return false;
    }
}

// Export for use in other files
window.supabaseClient = supabase;
```

---

## Step 6: Update Authentication to Use Supabase

Replace localStorage with Supabase database. Update `src/js/login.js`:

```javascript
/**
 * Login with Supabase Integration
 */

async function handlePhoneSubmit(e) {
    e.preventDefault();
    
    const phone = document.getElementById('phone').value.trim();
    const name = document.getElementById('name').value.trim();
    
    // Validate phone
    if (!whatsappService.validatePhoneNumber(phone)) {
        showToast('Please enter valid 10-digit mobile number', 'error');
        return;
    }
    
    currentPhone = phone;
    currentName = name;
    
    const btn = document.getElementById('sendOtpBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending OTP...';
    btn.disabled = true;
    
    try {
        // Generate OTP
        generatedOTP = whatsappService.generateOTP();
        
        // Save OTP to Supabase
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry
        
        const { data, error } = await supabaseClient
            .from('otp_verification')
            .insert([{
                phone: phone,
                otp: generatedOTP,
                expires_at: expiresAt.toISOString()
            }]);
        
        if (error) throw error;
        
        // Send OTP via WhatsApp
        const formattedPhone = whatsappService.formatPhoneNumber(phone);
        const result = await whatsappService.sendOTP(formattedPhone, generatedOTP);
        
        btn.disabled = false;
        
        if (result.success) {
            showToast('OTP sent to your WhatsApp!', 'success');
        } else {
            showToast('Please check console for OTP', 'warning');
            alert(`Development Mode: Your OTP is ${generatedOTP}`);
        }
        
        console.log('🔐 OTP for testing:', generatedOTP);
        
        // Switch to OTP step
        document.getElementById('phoneStep').classList.add('hidden');
        document.getElementById('otpStep').classList.remove('hidden');
        document.getElementById('sentToPhone').textContent = `+91 ${phone}`;
        document.querySelector('.otp-input').focus();
        startResendTimer();
        
    } catch (error) {
        console.error('Error sending OTP:', error);
        showToast('Failed to send OTP. Please try again.', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fab fa-whatsapp mr-2"></i>Send OTP via WhatsApp';
    }
}

async function handleOTPSubmit(e) {
    e.preventDefault();
    
    const otpInputs = document.querySelectorAll('.otp-input');
    const enteredOTP = Array.from(otpInputs).map(input => input.value).join('');
    
    if (enteredOTP.length !== 6) {
        showToast('Please enter complete 6-digit OTP', 'error');
        return;
    }
    
    const btn = document.getElementById('verifyOtpBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verifying...';
    btn.disabled = true;
    
    try {
        // Verify OTP from Supabase
        const { data: otpRecords, error } = await supabaseClient
            .from('otp_verification')
            .select('*')
            .eq('phone', currentPhone)
            .eq('otp', enteredOTP)
            .eq('verified', false)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (error) throw error;
        
        if (!otpRecords || otpRecords.length === 0) {
            showToast('Invalid or expired OTP', 'error');
            clearOTPInputs();
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Verify OTP';
            return;
        }
        
        // Mark OTP as verified
        await supabaseClient
            .from('otp_verification')
            .update({ verified: true })
            .eq('id', otpRecords[0].id);
        
        // Create or update user
        const { data: existingUser } = await supabaseClient
            .from('users')
            .select('*')
            .eq('phone', currentPhone)
            .single();
        
        let userId;
        
        if (existingUser) {
            // Update existing user
            const { data: updatedUser } = await supabaseClient
                .from('users')
                .update({
                    name: currentName,
                    phone_verified: true,
                    last_login: new Date().toISOString()
                })
                .eq('phone', currentPhone)
                .select()
                .single();
            
            userId = updatedUser.id;
        } else {
            // Create new user
            const { data: newUser } = await supabaseClient
                .from('users')
                .insert([{
                    phone: currentPhone,
                    name: currentName,
                    phone_verified: true,
                    role: 'user',
                    last_login: new Date().toISOString()
                }])
                .select()
                .single();
            
            userId = newUser.id;
        }
        
        // Create local session
        const userSession = {
            id: userId,
            phone: currentPhone,
            name: currentName,
            role: existingUser?.role || 'user',
            loggedIn: true,
            phoneVerified: true,
            verifiedAt: new Date().toISOString()
        };
        
        localStorage.setItem('userSession', JSON.stringify(userSession));
        
        // Log activity
        await supabaseClient
            .from('activity_log')
            .insert([{
                user_id: userId,
                phone: currentPhone,
                name: currentName,
                action: 'User logged in',
                page: 'login.html'
            }]);
        
        showToast('Login successful!', 'success');
        
        // Redirect
        setTimeout(() => {
            const returnUrl = new URLSearchParams(window.location.search).get('return') || 'order.html';
            window.location.href = returnUrl;
        }, 1000);
        
    } catch (error) {
        console.error('Error verifying OTP:', error);
        showToast('Verification failed. Please try again.', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Verify OTP';
    }
}
```

---

## Step 7: Update Order Creation

Update order submission to save to Supabase:

```javascript
async function createOrder(orderData) {
    try {
        const user = JSON.parse(localStorage.getItem('userSession'));
        
        // Prepare order items
        const items = orderData.cart.map(item => ({
            product_type: item.product,
            product_name: item.productName,
            configuration: item.configuration || {},
            quantity: item.quantity,
            unit_price: item.unitPrice || 0,
            subtotal: item.total
        }));
        
        // Call stored procedure to create order with items
        const { data, error } = await supabaseClient
            .rpc('create_order_with_items', {
                p_user_id: user.id,
                p_address_id: orderData.addressId,
                p_subtotal: orderData.subtotal,
                p_gst: orderData.gst,
                p_delivery_charge: orderData.deliveryCharge,
                p_total: orderData.total,
                p_payment_method: orderData.paymentMethod,
                p_delivery_method: orderData.deliveryMethod,
                p_items: items
            });
        
        if (error) throw error;
        
        return data; // Returns order ID
        
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
}
```

---

## Step 8: Activity Logging to Database

```javascript
async function logActivity(action, details = {}) {
    try {
        const user = JSON.parse(localStorage.getItem('userSession') || '{}');
        
        await supabaseClient
            .from('activity_log')
            .insert([{
                user_id: user.id || null,
                phone: user.phone || null,
                name: user.name || 'Guest',
                action: action,
                page: window.location.pathname,
                details: details
            }]);
            
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

// Usage
await logActivity('Added to cart', { product: 'Business Cards', quantity: 100 });
await logActivity('Cart abandoned', { total: 500, items: 3 });
```

---

## Step 9: Fetch User Orders

```javascript
async function getUserOrders() {
    try {
        const user = JSON.parse(localStorage.getItem('userSession'));
        
        const { data: orders, error } = await supabaseClient
            .from('orders')
            .select(`
                *,
                addresses (*),
                order_items (*)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return orders;
        
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}
```

---

## Step 10: Admin Dashboard Queries

```javascript
// Get daily summary
async function getDailySummary() {
    const { data } = await supabaseClient
        .from('daily_orders_summary')
        .select('*')
        .limit(30);
    
    return data;
}

// Get all activities
async function getAllActivities(limit = 100) {
    const { data } = await supabaseClient
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
    
    return data;
}

// Get cart abandonments
async function getCartAbandonments() {
    const { data } = await supabaseClient
        .from('cart_abandonment')
        .select('*')
        .eq('status', 'abandoned')
        .order('created_at', { ascending: false });
    
    return data;
}
```

---

## Benefits of Supabase Integration

✅ **Real-time Data:** Your data is immediately available across all devices
✅ **Secure:** Row Level Security ensures users only see their own data
✅ **Scalable:** Handles thousands of users without issues
✅ **Backup:** Automatic daily backups included
✅ **Analytics:** Built-in views for reporting
✅ **API:** REST and GraphQL APIs included
✅ **Auth:** Can use Supabase Auth for phone verification (future enhancement)

---

## Next Steps

1. ✅ Copy your Supabase credentials
2. ✅ Run the SQL schema in Supabase SQL Editor
3. ✅ Create `supabase-config.js` with your credentials
4. ✅ Update login.js to use Supabase
5. ✅ Update order creation to save to database
6. ✅ Test the flow end-to-end
7. ✅ Migrate existing localStorage data if needed

---

## Testing Checklist

- [ ] OTP saves to database
- [ ] User created after OTP verification
- [ ] Login activity logged
- [ ] Orders save to database
- [ ] Order items linked correctly
- [ ] User can view their orders
- [ ] Admin can see all activities
- [ ] Cart abandonment tracking works

---

**Your database is ready! Let me know when you have your Supabase credentials and I'll help you integrate it.** 🚀
