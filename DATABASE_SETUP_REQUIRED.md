# 🗄️ Database Setup Required

## ⚠️ Issue: Missing Database Tables

Your admin settings page is showing errors because some database tables haven't been created yet.

### Current Error:
```
GET .../rest/v1/razorpay_config 406 (Not Acceptable)
```

This means the tables don't exist in your Supabase database.

---

## 🚀 Quick Fix (5 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in left sidebar

### Step 2: Run Required SQL Scripts

Run these scripts **in order**:

#### 1. Base Tables (If not already created)
📁 File: `sql/setup/supabase-schema.sql`

```sql
-- This creates: users, addresses, products, orders, order_items, cart, activity_log
-- Check if already exists by running: SELECT * FROM users LIMIT 1;
```

#### 2. Payment Settings Table
📁 File: `sql/setup/payment-settings-schema.sql`

```sql
-- Creates payment_settings table for UPI, COD settings
CREATE TABLE IF NOT EXISTS payment_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    upi_id TEXT,
    merchant_name TEXT DEFAULT 'Disha Digital Prints',
    enable_cod BOOLEAN DEFAULT true,
    cod_charge DECIMAL(10,2) DEFAULT 20,
    enable_pickup BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. Razorpay Integration
📁 File: `sql/setup/razorpay-schema.sql`

**Copy this entire file and run in SQL Editor**

Key tables created:
- `razorpay_config` - API credentials
- `razorpay_payments` - Payment transactions
- `razorpay_webhooks` - Webhook events

#### 4. WhatsApp Integration (Optional)
📁 File: Create this if needed

```sql
-- WhatsApp Configuration Table
CREATE TABLE IF NOT EXISTS whatsapp_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number_id TEXT NOT NULL,
    access_token TEXT NOT NULL,
    api_version TEXT DEFAULT 'v18.0',
    business_phone_number TEXT NOT NULL,
    admin_phone_number TEXT NOT NULL,
    silent_notifications BOOLEAN DEFAULT false,
    enable_login_notifications BOOLEAN DEFAULT false,
    enable_cart_notifications BOOLEAN DEFAULT false,
    enable_order_notifications BOOLEAN DEFAULT true,
    enable_payment_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📋 Complete Setup Checklist

### Core Tables ✅
- [ ] `users` - User accounts
- [ ] `addresses` - Delivery addresses
- [ ] `products` - Product catalog
- [ ] `orders` - Customer orders
- [ ] `order_items` - Order line items
- [ ] `cart` - Shopping cart
- [ ] `activity_log` - User activity

### Configuration Tables ⚠️
- [ ] `base_pricing` - Product base prices
- [ ] `product_config` - Product options (paper sizes, materials, etc.)
- [ ] `payment_settings` - Payment configuration
- [ ] `razorpay_config` - Razorpay API settings
- [ ] `razorpay_payments` - Payment transactions
- [ ] `whatsapp_config` - WhatsApp API settings

### Admin Tables (Optional)
- [ ] `admin_users` - Admin accounts
- [ ] `admin_activity_log` - Admin actions
- [ ] `print_queue` - Production queue
- [ ] `inventory` - Stock management

---

## 🔍 How to Check What's Missing

### Method 1: Run in SQL Editor
```sql
-- List all tables in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Method 2: Browser Console
1. Open admin-settings.html
2. Press F12 (Developer Tools)
3. Look for 406 errors in Console tab
4. Each 406 error shows which table is missing

---

## 💾 Run All Setup Scripts At Once

Create a new SQL query and run:

```sql
-- Run these files in order:
\i sql/setup/supabase-schema.sql
\i sql/setup/admin-system-schema.sql
\i sql/setup/razorpay-schema.sql
\i sql/setup/payment-settings-schema.sql
```

Or manually copy-paste each file's content into SQL Editor.

---

## ✅ After Running SQL Scripts

1. **Refresh admin-settings.html page**
2. **Check Browser Console** - Should see:
   ```
   ✅ Razorpay config loaded
   ✅ WhatsApp config loaded
   ```
3. **Try saving settings** - Should work now!

---

## 🚨 If Still Not Working

### Check RLS Policies

The admin-settings page needs these tables to have permissive RLS or disabled RLS:

```sql
-- Temporarily disable RLS for testing (NOT for production!)
ALTER TABLE base_pricing DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE razorpay_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_config DISABLE ROW LEVEL SECURITY;
```

**For Production:** Create proper RLS policies instead of disabling.

---

## 📚 File Locations

All SQL setup files are in:
```
dishaPrints/
├── sql/
│   ├── setup/
│   │   ├── supabase-schema.sql          ← Core tables
│   │   ├── admin-system-schema.sql      ← Admin tables
│   │   ├── razorpay-schema.sql          ← Payment gateway
│   │   ├── payment-settings-schema.sql  ← Payment config
│   │   └── quick-setup.sql              ← All in one
```

---

## 🎯 Priority Order

**Must Run First:**
1. ✅ `supabase-schema.sql` - Core tables
2. ✅ `payment-settings-schema.sql` - Basic payments

**Should Run Next:**
3. ⚠️ `razorpay-schema.sql` - Online payments
4. ⚠️ WhatsApp config (if using WhatsApp)

**Optional:**
5. ⏸️ `admin-system-schema.sql` - Advanced admin features

---

## 📞 Need Help?

If you see this error after running all scripts:
- Check Supabase logs: **Database → Logs**
- Verify tables exist: Run `SELECT * FROM razorpay_config;`
- Check browser console for specific error codes

---

**Once you run the SQL scripts, the admin-settings page will work perfectly!** 🎉
