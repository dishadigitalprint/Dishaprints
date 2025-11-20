# Admin System Setup Guide

## Step 1: Execute Admin Schema in Supabase

1. Open your Supabase project: https://supabase.com/dashboard/project/noerqtwbyqeunjvnzlmg

2. Navigate to **SQL Editor** from the left sidebar

3. Click **"+ New query"**

4. Copy the entire contents of `admin-system-schema.sql` and paste into the SQL Editor

5. Click **Run** (or press Ctrl+Enter)

6. Wait for execution to complete - you should see "Success. No rows returned"

## Step 2: Verify Tables Created

Go to **Table Editor** and verify these new tables exist:
- ✅ inventory
- ✅ inventory_transactions
- ✅ daily_reports
- ✅ customer_notes
- ✅ production_queue
- ✅ expenses

## Step 3: Verify Views Created

In SQL Editor, run this query to check views:
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('customer_lifetime_value', 'todays_summary', 'low_stock_alert', 'production_status');
```

You should see all 4 views listed.

## Step 4: Check Sample Data

Run this query to verify inventory was populated:
```sql
SELECT item_name, category, current_quantity FROM inventory ORDER BY id;
```

You should see 7 items:
- A4 Paper 80 GSM
- A4 Paper 130 GSM  
- Business Card Stock 300 GSM
- Black Ink Cartridge
- Color Ink Cartridge
- Spiral Binding Coil
- Lamination Sheet A4

## Step 5: Access Admin Dashboard

1. Make sure your server is running: `py -3 -m http.server 8000`

2. Login with admin credentials:
   - Phone: **9876543210**
   - OTP: Any 6-digit code (stored in database)

3. Navigate to: http://localhost:8000/admin-dashboard.html

## Features Available

### Dashboard Overview
- Today's orders count
- Today's revenue
- Pending orders count
- Low stock alerts
- Recent 5 orders
- Order status breakdown
- Low stock items list

### Automatic Features
- ✅ Production queue auto-created when order placed
- ✅ Production queue auto-updated when order status changes
- ✅ Real-time views for analytics
- ✅ Auto-refresh every 5 minutes

## Troubleshooting

### If tables don't appear:
1. Check for errors in SQL execution
2. Ensure core schema was executed first (users, orders tables must exist)
3. Check RLS (Row Level Security) - admin queries should bypass RLS

### If views show no data:
- Views are real-time, they'll show data once:
  - `todays_summary` - orders are placed today
  - `low_stock_alert` - inventory falls below threshold
  - `customer_lifetime_value` - customers have orders
  - `production_status` - production queue has items

### If you get authentication errors:
1. Ensure you're logged in as admin (phone: 9876543210)
2. Check sessionStorage has currentUser with role: 'admin'
3. Run in console: `JSON.parse(sessionStorage.getItem('currentUser'))`

## What's Next

After executing the schema, you can:

1. **View Dashboard**: See today's summary and analytics
2. **Manage Orders**: Create admin-orders.html page
3. **Track Inventory**: Create admin-inventory.html page
4. **View Reports**: Create admin-reports.html page
5. **Manage Production**: Create admin-production.html page

## Database Functions Available

### get_revenue_report(start_date, end_date)
Get revenue report for date range:
```sql
SELECT * FROM get_revenue_report('2024-11-01', '2024-11-30');
```

### Views for Real-time Data
```sql
-- Today's summary
SELECT * FROM todays_summary;

-- Low stock items
SELECT * FROM low_stock_alert;

-- Customer lifetime values
SELECT * FROM customer_lifetime_value ORDER BY total_spent DESC LIMIT 10;

-- Production status
SELECT * FROM production_status WHERE status != 'completed';
```

## Sample Inventory Operations

### Add new inventory item:
```sql
INSERT INTO inventory (item_name, category, unit, current_quantity, cost_price, selling_price, low_stock_threshold, supplier_name, supplier_phone)
VALUES ('Premium Paper A3', 'paper', 'ream', 50, 450, 600, 10, 'Paper World', '9876543210');
```

### Record stock in:
```sql
INSERT INTO inventory_transactions (inventory_id, transaction_type, quantity, unit_cost, supplier_name, notes)
VALUES (1, 'purchase', 100, 280, 'Paper Mart', 'Bulk purchase for month');
```

### Record stock out (automatic on order):
Happens automatically via triggers when order status changes.

## Next Steps

1. ✅ Execute admin-system-schema.sql
2. ✅ Verify tables and views
3. ✅ Check sample data
4. ✅ Login as admin
5. ✅ Access dashboard
6. Create remaining admin pages
7. Integrate file uploads
8. Add expense tracking
9. Configure WhatsApp notifications

---

**Remember**: Admin phone number is **9876543210** - this is set in the schema with admin role.
