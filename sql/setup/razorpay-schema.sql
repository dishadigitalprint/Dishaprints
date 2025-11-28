-- =====================================================
-- Razorpay Payment Gateway Integration Schema
-- =====================================================
-- Purpose: Store Razorpay payment transactions and configuration
-- Last Updated: November 19, 2025
-- =====================================================

-- Table: razorpay_config
-- Stores admin-configured Razorpay API credentials
CREATE TABLE IF NOT EXISTS razorpay_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_id TEXT NOT NULL, -- Razorpay Key ID (public)
    key_secret TEXT NOT NULL, -- Razorpay Key Secret (encrypted)
    mode TEXT NOT NULL DEFAULT 'test', -- 'test' or 'live'
    enabled BOOLEAN DEFAULT true,
    brand_name TEXT DEFAULT 'Disha Digital Prints',
    brand_logo TEXT, -- URL to logo
    brand_color TEXT DEFAULT '#1E6CE0',
    webhook_secret TEXT, -- For webhook signature verification
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Table: razorpay_payments
-- Stores all Razorpay payment transactions
CREATE TABLE IF NOT EXISTS razorpay_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    
    -- Razorpay IDs
    razorpay_order_id TEXT UNIQUE NOT NULL, -- Order ID created by Razorpay
    razorpay_payment_id TEXT UNIQUE, -- Payment ID after successful payment
    razorpay_signature TEXT, -- Signature for verification
    
    -- Payment Details
    amount INTEGER NOT NULL, -- Amount in paise (₹100 = 10000 paise)
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'created', -- created, authorized, captured, refunded, failed
    method TEXT, -- card, netbanking, wallet, upi, etc.
    
    -- Additional Info
    email TEXT,
    contact TEXT,
    description TEXT,
    
    -- Payment Method Details (JSON)
    payment_details JSONB, -- Stores card last4, bank, wallet name, etc.
    
    -- Error Handling
    error_code TEXT,
    error_description TEXT,
    error_source TEXT,
    error_step TEXT,
    error_reason TEXT,
    
    -- Refund Details
    refund_status TEXT, -- null, partial, full
    refund_amount INTEGER, -- Amount refunded in paise
    refund_id TEXT, -- Razorpay refund ID
    refund_reason TEXT,
    refunded_at TIMESTAMPTZ,
    
    -- Webhooks
    webhook_received BOOLEAN DEFAULT false,
    webhook_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    captured_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: razorpay_webhooks
-- Log all webhook events from Razorpay
CREATE TABLE IF NOT EXISTS razorpay_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id TEXT UNIQUE NOT NULL, -- Razorpay event ID
    event_type TEXT NOT NULL, -- payment.authorized, payment.captured, etc.
    payment_id UUID REFERENCES razorpay_payments(id),
    payload JSONB NOT NULL, -- Full webhook payload
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_razorpay_payments_order_id ON razorpay_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_payments_user_id ON razorpay_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_payments_status ON razorpay_payments(status);
CREATE INDEX IF NOT EXISTS idx_razorpay_payments_razorpay_order_id ON razorpay_payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_payments_razorpay_payment_id ON razorpay_payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_payments_created_at ON razorpay_payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_razorpay_webhooks_event_type ON razorpay_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_razorpay_webhooks_processed ON razorpay_webhooks(processed);

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_razorpay_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_razorpay_payments_updated_at ON razorpay_payments;
CREATE TRIGGER trigger_razorpay_payments_updated_at
    BEFORE UPDATE ON razorpay_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_razorpay_updated_at();

DROP TRIGGER IF EXISTS trigger_razorpay_config_updated_at ON razorpay_config;
CREATE TRIGGER trigger_razorpay_config_updated_at
    BEFORE UPDATE ON razorpay_config
    FOR EACH ROW
    EXECUTE FUNCTION update_razorpay_updated_at();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

ALTER TABLE razorpay_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE razorpay_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE razorpay_webhooks ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can manage Razorpay configuration
DROP POLICY IF EXISTS "Admins can manage razorpay_config" ON razorpay_config;
CREATE POLICY "Admins can manage razorpay_config"
    ON razorpay_config
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Policy: Users can view their own payments
DROP POLICY IF EXISTS "Users can view own payments" ON razorpay_payments;
CREATE POLICY "Users can view own payments"
    ON razorpay_payments
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy: Admins can view all payments
DROP POLICY IF EXISTS "Admins can view all payments" ON razorpay_payments;
CREATE POLICY "Admins can view all payments"
    ON razorpay_payments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Policy: System can insert payments (service role)
-- Note: Payment creation will be done via service role API calls

-- Policy: Only admins can view webhooks
DROP POLICY IF EXISTS "Admins can view webhooks" ON razorpay_webhooks;
CREATE POLICY "Admins can view webhooks"
    ON razorpay_webhooks
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function: Get Razorpay configuration (without exposing secret)
CREATE OR REPLACE FUNCTION get_razorpay_config()
RETURNS TABLE (
    key_id TEXT,
    mode TEXT,
    enabled BOOLEAN,
    brand_name TEXT,
    brand_logo TEXT,
    brand_color TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rc.key_id,
        rc.mode,
        rc.enabled,
        rc.brand_name,
        rc.brand_logo,
        rc.brand_color
    FROM razorpay_config rc
    ORDER BY rc.updated_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if payment is verified
CREATE OR REPLACE FUNCTION is_payment_verified(p_razorpay_payment_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_status TEXT;
BEGIN
    SELECT status INTO v_status
    FROM razorpay_payments
    WHERE razorpay_payment_id = p_razorpay_payment_id;
    
    RETURN v_status IN ('authorized', 'captured');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Sample Data (for testing)
-- =====================================================

-- Insert default Razorpay config (REPLACE WITH YOUR ACTUAL KEYS)
INSERT INTO razorpay_config (
    key_id,
    key_secret,
    mode,
    enabled,
    brand_name,
    brand_logo,
    brand_color,
    webhook_secret
) VALUES (
    'rzp_test_XXXXXXXXXXXXXX', -- Replace with your test key
    'YOUR_KEY_SECRET_HERE', -- Replace with your key secret
    'test',
    true,
    'Disha Digital Prints',
    'https://yourdomain.com/logo.png',
    '#1E6CE0',
    'YOUR_WEBHOOK_SECRET_HERE' -- Replace with webhook secret
) ON CONFLICT DO NOTHING;

-- =====================================================
-- Payment Status Reference
-- =====================================================
-- created:      Razorpay order created, awaiting payment
-- authorized:   Payment authorized but not captured (for manual capture)
-- captured:     Payment successful and captured
-- refunded:     Payment refunded (partial or full)
-- failed:       Payment failed

-- =====================================================
-- Razorpay Payment Methods
-- =====================================================
-- card:         Credit/Debit cards
-- netbanking:   Net banking
-- wallet:       Paytm, Mobikwik, etc.
-- upi:          UPI payments
-- emi:          EMI options
-- cardless_emi: Cardless EMI (ZestMoney, etc.)
-- paylater:     Pay later options

-- =====================================================
-- Integration Notes
-- =====================================================
-- 1. Get API keys from: https://dashboard.razorpay.com/app/keys
-- 2. Test mode keys start with: rzp_test_
-- 3. Live mode keys start with: rzp_live_
-- 4. Always verify payment signature on backend
-- 5. Use webhooks for reliable payment updates
-- 6. Store key_secret encrypted (use Supabase Vault in production)
-- 7. Set up webhook URL: https://yourdomain.com/api/razorpay/webhook

-- =====================================================
-- Useful Queries
-- =====================================================

-- Get today's successful payments
-- SELECT COUNT(*), SUM(amount)/100 as total_amount_inr
-- FROM razorpay_payments
-- WHERE status IN ('authorized', 'captured')
-- AND DATE(created_at) = CURRENT_DATE;

-- Get payment success rate
-- SELECT 
--     COUNT(CASE WHEN status IN ('authorized', 'captured') THEN 1 END) * 100.0 / COUNT(*) as success_rate
-- FROM razorpay_payments;

-- Get popular payment methods
-- SELECT method, COUNT(*) as count
-- FROM razorpay_payments
-- WHERE status IN ('authorized', 'captured')
-- GROUP BY method
-- ORDER BY count DESC;
