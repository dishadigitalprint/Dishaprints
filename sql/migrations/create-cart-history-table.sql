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

-- Grant permissions (adjust based on your RLS setup)
-- ALTER TABLE cart_history ENABLE ROW LEVEL SECURITY;

SELECT 'cart_history table created successfully!' AS status;
