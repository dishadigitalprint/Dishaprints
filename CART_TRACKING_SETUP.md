# Cart Tracking Setup Instructions

## Problem
The `cart_history` table doesn't exist in your Supabase database, so cart activity is not being saved.

## Solution
Run the SQL script to create the `cart_history` table.

## Steps to Fix

### 1. Go to Supabase SQL Editor
1. Open: https://supabase.com/dashboard/project/noerqtwbyqeunjvnzlmg/editor
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**

### 2. Run the SQL Script
Copy and paste this entire SQL script:

```sql
-- Create cart_history table for detailed cart activity tracking
-- This table tracks every cart action (add, remove, update, abandon, checkout)

CREATE TABLE IF NOT EXISTS cart_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Session & User Info
    session_id VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    phone VARCHAR(15),
    name VARCHAR(100),
    email VARCHAR(255),
    
    -- Action Details
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'item_added', 'item_removed', 'item_updated', 
        'checkout_started', 'checkout_completed', 
        'cart_abandoned', 'cart_cleared'
    )),
    
    -- Cart State
    cart_snapshot JSONB,
    cart_value DECIMAL(10, 2),
    item_count INTEGER,
    
    -- Item-Specific Details (for add/remove/update actions)
    item_details JSONB,
    product_type VARCHAR(50),
    product_name VARCHAR(255),
    
    -- Context
    page_url TEXT,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_cart_history_session ON cart_history(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_history_user ON cart_history(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_history_phone ON cart_history(phone);
CREATE INDEX IF NOT EXISTS idx_cart_history_action ON cart_history(action);
CREATE INDEX IF NOT EXISTS idx_cart_history_created ON cart_history(created_at DESC);

-- Comment
COMMENT ON TABLE cart_history IS 'Detailed tracking of all cart activities for analytics and follow-up';

SELECT 'cart_history table created successfully!' AS status;
```

### 3. Execute
Click **"Run"** button or press `Ctrl+Enter` / `Cmd+Enter`

### 4. Verify
You should see: `"cart_history table created successfully!"`

### 5. Test
1. Go to your website
2. Add an item to cart
3. Check Supabase Table Editor → `cart_history` table
4. You should see a new row with the cart activity

## What Gets Tracked

Once the table is created, the system will automatically track:

- ✅ **Items added to cart** - with phone, name, timestamp
- ✅ **Items removed from cart**
- ✅ **Items updated** (quantity changes)
- ✅ **Checkout started**
- ✅ **Checkout completed**
- ✅ **Cart abandoned**
- ✅ **Cart cleared**

## Admin View

After creating the table, the Admin Cart History page will show:
- Customer name and phone
- Cart items and value
- Time of last activity
- Contact buttons for follow-up

## Files Affected

- `src/js/cart-tracker.js` - Saves to `cart_history` table
- `src/js/admin-cart-history.js` - Reads from `cart_history` table
- All order pages automatically track cart activity

---

**Note:** The `cart_history` table is separate from the older `cart_abandonment` table. This new table provides more detailed tracking of all cart activities, not just abandonments.
