# 🚀 Supabase Setup Guide - Step by Step

## ✅ Step 1: Create Database Tables (REQUIRED - Do This First!)

1. **Go to Supabase SQL Editor:**
   - Open: https://supabase.com/dashboard/project/noerqtwbyqeunjvnzlmg/editor
   - Click **SQL Editor** in the left sidebar
   - Click **New Query** button

2. **Copy the SQL Schema:**
   - Open the file: `c:\ai\Disha\dishaPrints\supabase-schema.sql`
   - Select ALL content (Ctrl+A)
   - Copy it (Ctrl+C)

3. **Run the Schema:**
   - Paste into Supabase SQL Editor
   - Click **Run** button (bottom right corner)
   - Wait 5-10 seconds
   - ✅ You should see: "Success. No rows returned"

4. **Verify Tables Created:**
   - Click **Table Editor** in left sidebar
   - You should see 8 tables:
     - ✅ `users`
     - ✅ `otp_verification`
     - ✅ `addresses`
     - ✅ `orders`
     - ✅ `order_items`
     - ✅ `activity_log`
     - ✅ `cart_abandonment`
     - ✅ `whatsapp_messages`

---

## ✅ Step 2: Add Supabase Script to Your HTML Files

Add this line to the `<head>` section of these files:

### Files to Update:
1. `src/index.html`
2. `src/login.html`
3. `src/cart.html`
4. `src/checkout-address.html`
5. `src/checkout-payment.html`
6. `src/order.html`
7. `src/order-documents.html`
8. `src/order-business-cards.html`
9. `src/order-brochures.html`
10. `src/admin-activity.html`

### Add this script tag:
```html
<!-- Supabase Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-config.js"></script>
```

**Place it BEFORE other script tags** (but after the closing `</head>` tag is fine too)

---

## ✅ Step 3: Test Database Connection

1. **Start your local server:**
   ```powershell
   cd c:\ai\Disha\dishaPrints\src
   python -m http.server 8000
   ```

2. **Open browser:**
   - Go to: http://localhost:8000
   - Open Developer Console (F12)
   - Type: `testSupabaseConnection()`
   - Press Enter

3. **Expected Result:**
   - ✅ "Supabase connected successfully!"
   - If you see error: Make sure you ran the SQL schema (Step 1)

---

## ✅ Step 4: Test User Creation

1. **In browser console, test creating a user:**
   ```javascript
   // Test 1: Create a user
   const testUser = await supabaseClient
       .from('users')
       .insert([{
           phone: '9876543210',
           name: 'Test User',
           email: 'test@example.com',
           role: 'user',
           phone_verified: true
       }])
       .select();
   
   console.log('User created:', testUser);
   ```

2. **Verify in Supabase:**
   - Go to **Table Editor** → **users**
   - You should see your test user

3. **Test 2: Fetch the user:**
   ```javascript
   const { data } = await supabaseClient
       .from('users')
       .select('*')
       .eq('phone', '9876543210');
   
   console.log('Fetched user:', data);
   ```

---

## ✅ Step 5: Integration Status Check

After completing Steps 1-4, verify:

### ✅ Database Setup:
- [ ] SQL schema executed successfully
- [ ] 8 tables created in Supabase
- [ ] Test connection works from browser console

### ✅ Frontend Setup:
- [ ] Supabase script added to HTML files
- [ ] `supabase-config.js` loaded
- [ ] No console errors when loading pages

### ✅ Test Operations:
- [ ] Can insert test user
- [ ] Can fetch user data
- [ ] Connection test passes

---

## 🎯 Next Steps After Setup

Once the above steps are complete, I'll help you:

1. **Update login.js** - Save OTP to Supabase instead of localStorage
2. **Update auth-utils.js** - Fetch user from database
3. **Update order pages** - Save orders to database
4. **Update activity logging** - Save activities to database
5. **Create admin dashboard** - Fetch real-time data from Supabase

---

## 🔧 Quick Commands Reference

### Test Connection:
```javascript
await testSupabaseConnection()
```

### Create User:
```javascript
const { data, error } = await supabaseClient
    .from('users')
    .insert([{ phone: '9876543210', name: 'John', phone_verified: true }])
    .select();
```

### Fetch All Users:
```javascript
const { data } = await supabaseClient.from('users').select('*');
console.table(data);
```

### Fetch User Orders:
```javascript
const { data } = await supabaseClient
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', 'USER_ID_HERE');
```

### Log Activity:
```javascript
await supabaseClient.from('activity_log').insert([{
    phone: '9876543210',
    name: 'John',
    action: 'Page viewed',
    page: 'index.html'
}]);
```

---

## ❗ Troubleshooting

### Error: "relation 'users' does not exist"
- ❌ You haven't run the SQL schema
- ✅ Go back to Step 1 and run `supabase-schema.sql`

### Error: "Failed to fetch"
- ❌ Wrong Supabase URL or key
- ✅ Check `supabase-config.js` credentials

### Error: "Row Level Security policy violation"
- ❌ RLS is blocking your request
- ✅ For testing, you can disable RLS in Table Editor settings

### No tables showing:
- ❌ SQL schema wasn't executed
- ✅ Run the entire schema file in SQL Editor

---

## 📞 Current Status

**✅ Configured:**
- Supabase project created
- Credentials saved in `supabase-config.js`
- Configuration file created

**⏳ Next (You need to do):**
1. Run SQL schema in Supabase (Step 1)
2. Add script tags to HTML files (Step 2)
3. Test connection (Step 3)

**🎯 After that:**
- I'll update all JavaScript files to use Supabase
- Migration from localStorage to database
- Real-time order tracking
- Admin dashboard with live data

---

**Start with Step 1 now - Run the SQL schema!** 🚀
