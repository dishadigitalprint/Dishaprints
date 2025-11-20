-- ============================================
-- Payment & Cart History Schema
-- ============================================

-- 0. Helper Function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Payment Settings Table
-- Stores payment configuration like UPI ID, merchant name, and payment method settings
CREATE TABLE IF NOT EXISTS payment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upi_id VARCHAR(100) NOT NULL,
    merchant_name VARCHAR(255) NOT NULL DEFAULT 'Disha Digital Prints',
    enable_cod BOOLEAN DEFAULT true,
    cod_charge DECIMAL(10, 2) DEFAULT 20.00,
    enable_pickup BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger for updated_at
CREATE TRIGGER update_payment_settings_updated_at 
    BEFORE UPDATE ON payment_settings
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default payment settings
INSERT INTO payment_settings (upi_id, merchant_name, enable_cod, cod_charge, enable_pickup)
VALUES ('dishaprints@paytm', 'Disha Digital Prints', true, 20.00, true)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE payment_settings IS 'Payment configuration for UPI QR code generation and payment methods';

-- 2. Cart History Table
-- Tracks all cart activities (add, remove, update, checkout, abandon)
CREATE TABLE IF NOT EXISTS cart_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    
    -- User Information (for non-logged-in users)
    phone VARCHAR(15),
    name VARCHAR(100),
    email VARCHAR(255),
    
    -- Cart Details
    action VARCHAR(20) NOT NULL CHECK (action IN ('item_added', 'item_removed', 'item_updated', 'checkout_started', 'checkout_completed', 'cart_abandoned', 'cart_cleared')),
    product_type VARCHAR(50),
    product_name VARCHAR(255),
    
    -- Cart Snapshot (entire cart at this moment)
    cart_snapshot JSONB,
    cart_value DECIMAL(10, 2),
    item_count INT,
    
    -- Item Details (for add/remove actions)
    item_details JSONB,
    
    -- Context
    page_url TEXT,
    user_agent TEXT,
    ip_address VARCHAR(45),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Follow-up tracking
    contacted BOOLEAN DEFAULT false,
    contacted_at TIMESTAMPTZ,
    contact_notes TEXT,
    converted BOOLEAN DEFAULT false,
    converted_at TIMESTAMPTZ
);

-- Indexes for cart history
CREATE INDEX idx_cart_history_user ON cart_history(user_id);
CREATE INDEX idx_cart_history_session ON cart_history(session_id);
CREATE INDEX idx_cart_history_phone ON cart_history(phone);
CREATE INDEX idx_cart_history_action ON cart_history(action);
CREATE INDEX idx_cart_history_created ON cart_history(created_at DESC);
CREATE INDEX idx_cart_history_abandoned ON cart_history(action, contacted) WHERE action = 'cart_abandoned';

COMMENT ON TABLE cart_history IS 'Complete cart activity tracking for follow-up and conversion analysis';

-- 3. Cart Summary View
-- Provides quick insights on cart abandonment and conversion
CREATE OR REPLACE VIEW cart_abandonment_summary AS
SELECT DISTINCT ON (session_id)
    user_id,
    phone,
    name,
    email,
    session_id,
    created_at as last_activity,
    cart_value,
    item_count,
    cart_snapshot as last_cart_snapshot,
    contacted,
    converted,
    CASE 
        WHEN created_at > NOW() - INTERVAL '1 hour' THEN 'hot'
        WHEN created_at > NOW() - INTERVAL '24 hours' THEN 'warm'
        WHEN created_at > NOW() - INTERVAL '7 days' THEN 'cold'
        ELSE 'expired'
    END as lead_temperature
FROM cart_history
WHERE action IN ('cart_abandoned', 'checkout_started')
    AND NOT EXISTS (
        SELECT 1 FROM cart_history ch2 
        WHERE ch2.session_id = cart_history.session_id 
        AND ch2.action = 'checkout_completed'
    )
ORDER BY session_id, created_at DESC;

COMMENT ON VIEW cart_abandonment_summary IS 'Abandoned carts summary for sales follow-up';

-- 4. Cart Conversion Metrics View
CREATE OR REPLACE VIEW cart_conversion_metrics AS
SELECT 
    DATE(created_at) as activity_date,
    COUNT(DISTINCT CASE WHEN action = 'item_added' THEN session_id END) as carts_created,
    COUNT(DISTINCT CASE WHEN action = 'checkout_started' THEN session_id END) as checkouts_started,
    COUNT(DISTINCT CASE WHEN action = 'checkout_completed' THEN session_id END) as checkouts_completed,
    COUNT(DISTINCT CASE WHEN action = 'cart_abandoned' THEN session_id END) as carts_abandoned,
    ROUND(
        COUNT(DISTINCT CASE WHEN action = 'checkout_completed' THEN session_id END)::NUMERIC / 
        NULLIF(COUNT(DISTINCT CASE WHEN action = 'item_added' THEN session_id END), 0) * 100, 2
    ) as conversion_rate,
    SUM(CASE WHEN action = 'checkout_completed' THEN cart_value ELSE 0 END) as total_revenue,
    AVG(CASE WHEN action = 'checkout_completed' THEN cart_value END) as avg_order_value
FROM cart_history
GROUP BY DATE(created_at)
ORDER BY activity_date DESC;

COMMENT ON VIEW cart_conversion_metrics IS 'Daily cart and conversion metrics for analytics';

-- 5. Function to detect abandoned carts
CREATE OR REPLACE FUNCTION detect_abandoned_carts()
RETURNS TABLE (
    session_id VARCHAR,
    user_id UUID,
    phone VARCHAR,
    name VARCHAR,
    cart_value NUMERIC,
    abandoned_minutes INT,
    cart_snapshot JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (ch.session_id)
        ch.session_id,
        ch.user_id,
        ch.phone,
        ch.name,
        ch.cart_value,
        EXTRACT(EPOCH FROM (NOW() - ch.created_at))/60 as abandoned_minutes,
        ch.cart_snapshot
    FROM cart_history ch
    WHERE ch.action IN ('item_added', 'checkout_started')
        AND ch.created_at > NOW() - INTERVAL '24 hours'
        AND ch.created_at < NOW() - INTERVAL '15 minutes'
        AND NOT EXISTS (
            SELECT 1 FROM cart_history ch2 
            WHERE ch2.session_id = ch.session_id 
            AND ch2.action IN ('checkout_completed', 'cart_abandoned')
        )
    ORDER BY ch.session_id, ch.created_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION detect_abandoned_carts IS 'Identifies carts abandoned for >15 minutes in last 24 hours';

-- 6. WhatsApp Configuration Table
-- Stores WhatsApp Business API credentials and settings
CREATE TABLE IF NOT EXISTS whatsapp_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number_id VARCHAR(100) NOT NULL,
    access_token TEXT NOT NULL,
    api_version VARCHAR(10) DEFAULT 'v18.0',
    business_phone_number VARCHAR(20) NOT NULL,
    admin_phone_number VARCHAR(20) NOT NULL,
    silent_notifications BOOLEAN DEFAULT true,
    enable_login_notifications BOOLEAN DEFAULT true,
    enable_cart_notifications BOOLEAN DEFAULT true,
    enable_order_notifications BOOLEAN DEFAULT true,
    enable_payment_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger for updated_at
CREATE TRIGGER update_whatsapp_config_updated_at 
    BEFORE UPDATE ON whatsapp_config
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default WhatsApp config (update these values in admin panel)
INSERT INTO whatsapp_config (
    phone_number_id, 
    access_token, 
    api_version,
    business_phone_number, 
    admin_phone_number,
    silent_notifications,
    enable_login_notifications,
    enable_cart_notifications,
    enable_order_notifications,
    enable_payment_notifications
)
VALUES (
    'YOUR_PHONE_NUMBER_ID', 
    'YOUR_ACCESS_TOKEN', 
    'v18.0',
    '+919876543210', 
    '+919876543210',
    true,
    true,
    true,
    true,
    true
)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE whatsapp_config IS 'WhatsApp Business API configuration for OTP and admin notifications';

SELECT 'Payment settings, cart history, and WhatsApp config tables created successfully!' as status;
