-- ============================================
-- Disha Digital Prints - Supabase Database Schema
-- ============================================

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    phone_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Index for faster phone lookups
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);

-- 2. OTP Table (for phone verification)
CREATE TABLE otp_verification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(10) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN DEFAULT false,
    attempts INT DEFAULT 0,
    CONSTRAINT otp_expires_check CHECK (expires_at > created_at)
);

-- Index for phone and expiry lookups
CREATE INDEX idx_otp_phone ON otp_verification(phone);
CREATE INDEX idx_otp_expires ON otp_verification(expires_at);

-- Auto-delete expired OTPs (cleanup after 1 hour)
CREATE OR REPLACE FUNCTION delete_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM otp_verification 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- 3. Addresses Table
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(10) NOT NULL,
    email VARCHAR(255),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(6) NOT NULL,
    landmark VARCHAR(255),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX idx_addresses_user ON addresses(user_id);
CREATE INDEX idx_addresses_default ON addresses(user_id, is_default);

-- 4. Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address_id UUID REFERENCES addresses(id),
    
    -- Order Details
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled')),
    
    -- Pricing
    subtotal DECIMAL(10, 2) NOT NULL,
    gst DECIMAL(10, 2) NOT NULL,
    delivery_charge DECIMAL(10, 2) DEFAULT 0,
    cod_charge DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    
    -- Payment
    payment_method VARCHAR(20) CHECK (payment_method IN ('upi', 'cod', 'store_pickup')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_screenshot TEXT,
    transaction_id VARCHAR(100),
    
    -- Delivery
    delivery_method VARCHAR(20) CHECK (delivery_method IN ('delivery', 'pickup')),
    estimated_delivery DATE,
    actual_delivery TIMESTAMP WITH TIME ZONE,
    
    -- Tracking
    tracking_number VARCHAR(50),
    courier_name VARCHAR(100),
    
    -- Notes
    customer_notes TEXT,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for orders
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Function to generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        new_number := 'DDP' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
        
        SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = new_number) INTO exists;
        
        IF NOT exists THEN
            RETURN new_number;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Order Items Table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Product Details
    product_type VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    
    -- Configuration (stored as JSONB for flexibility)
    configuration JSONB NOT NULL,
    
    -- Files
    file_url TEXT,
    file_name VARCHAR(255),
    
    -- Pricing
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for order lookups
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_type);

-- 6. Activity Log Table
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    phone VARCHAR(10),
    name VARCHAR(100),
    
    -- Activity Details
    action VARCHAR(255) NOT NULL,
    page VARCHAR(255),
    details JSONB,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for activity log
CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_phone ON activity_log(phone);
CREATE INDEX idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX idx_activity_action ON activity_log(action);

-- 7. Cart Abandonment Tracking
CREATE TABLE cart_abandonment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(10) NOT NULL,
    name VARCHAR(100),
    
    -- Cart Details
    cart_items JSONB NOT NULL,
    total_amount DECIMAL(10, 2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'abandoned' CHECK (status IN ('abandoned', 'recovered', 'converted')),
    
    -- Follow-up
    follow_up_sent BOOLEAN DEFAULT false,
    follow_up_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recovered_at TIMESTAMP WITH TIME ZONE
);

-- Index for cart abandonment
CREATE INDEX idx_cart_abandonment_user ON cart_abandonment(user_id);
CREATE INDEX idx_cart_abandonment_phone ON cart_abandonment(phone);
CREATE INDEX idx_cart_abandonment_status ON cart_abandonment(status);

-- 8. WhatsApp Messages Log
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_phone VARCHAR(15) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    template_name VARCHAR(100),
    message_content TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    error_message TEXT,
    
    -- WhatsApp Response
    whatsapp_message_id VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Index for WhatsApp messages
CREATE INDEX idx_whatsapp_phone ON whatsapp_messages(recipient_phone);
CREATE INDEX idx_whatsapp_status ON whatsapp_messages(status);
CREATE INDEX idx_whatsapp_created ON whatsapp_messages(created_at DESC);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number_trigger BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Ensure only one default address per user
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE addresses 
        SET is_default = false 
        WHERE user_id = NEW.user_id 
        AND id != NEW.id
        AND is_default = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_address_trigger BEFORE INSERT OR UPDATE ON addresses
    FOR EACH ROW EXECUTE FUNCTION ensure_single_default_address();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Addresses policies
CREATE POLICY "Users can view own addresses"
    ON addresses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses"
    ON addresses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
    ON addresses FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
    ON addresses FOR DELETE
    USING (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Order items policies
CREATE POLICY "Users can view own order items"
    ON order_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id 
        AND orders.user_id = auth.uid()
    ));

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert admin user
INSERT INTO users (phone, name, email, role, phone_verified)
VALUES ('9876543210', 'Admin User', 'admin@dishaprints.com', 'admin', true);

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- Daily orders summary
CREATE OR REPLACE VIEW daily_orders_summary AS
SELECT 
    DATE(created_at) as order_date,
    COUNT(*) as total_orders,
    SUM(total) as total_revenue,
    AVG(total) as avg_order_value,
    COUNT(DISTINCT user_id) as unique_customers
FROM orders
WHERE status != 'cancelled'
GROUP BY DATE(created_at)
ORDER BY order_date DESC;

-- User activity summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    u.id,
    u.phone,
    u.name,
    u.created_at as registered_at,
    COUNT(DISTINCT o.id) as total_orders,
    SUM(o.total) as lifetime_value,
    MAX(o.created_at) as last_order_date,
    COUNT(DISTINCT al.id) as total_activities
FROM users u
LEFT JOIN orders o ON u.id = o.user_id AND o.status != 'cancelled'
LEFT JOIN activity_log al ON u.id = al.user_id
GROUP BY u.id, u.phone, u.name, u.created_at;

-- Order status summary
CREATE OR REPLACE VIEW order_status_summary AS
SELECT 
    status,
    COUNT(*) as count,
    SUM(total) as total_amount
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY status;

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Create order with items
CREATE OR REPLACE FUNCTION create_order_with_items(
    p_user_id UUID,
    p_address_id UUID,
    p_subtotal DECIMAL,
    p_gst DECIMAL,
    p_delivery_charge DECIMAL,
    p_total DECIMAL,
    p_payment_method VARCHAR,
    p_delivery_method VARCHAR,
    p_items JSONB
)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
BEGIN
    -- Insert order
    INSERT INTO orders (
        user_id, address_id, subtotal, gst, delivery_charge, total,
        payment_method, delivery_method, status
    ) VALUES (
        p_user_id, p_address_id, p_subtotal, p_gst, p_delivery_charge, p_total,
        p_payment_method, p_delivery_method, 'pending'
    ) RETURNING id INTO v_order_id;
    
    -- Insert order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO order_items (
            order_id, product_type, product_name, configuration,
            quantity, unit_price, subtotal
        ) VALUES (
            v_order_id,
            v_item->>'product_type',
            v_item->>'product_name',
            v_item->'configuration',
            (v_item->>'quantity')::INT,
            (v_item->>'unit_price')::DECIMAL,
            (v_item->>'subtotal')::DECIMAL
        );
    END LOOP;
    
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Composite indexes for common queries
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX idx_activity_user_created ON activity_log(user_id, created_at DESC);

-- GIN index for JSONB columns
CREATE INDEX idx_order_items_config ON order_items USING GIN (configuration);
CREATE INDEX idx_activity_details ON activity_log USING GIN (details);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE users IS 'User accounts with phone-based authentication';
COMMENT ON TABLE otp_verification IS 'Temporary OTP codes for phone verification';
COMMENT ON TABLE addresses IS 'User delivery addresses';
COMMENT ON TABLE orders IS 'Customer orders with payment and delivery details';
COMMENT ON TABLE order_items IS 'Individual items within each order';
COMMENT ON TABLE activity_log IS 'User activity tracking for analytics';
COMMENT ON TABLE cart_abandonment IS 'Tracks abandoned carts for follow-up';
COMMENT ON TABLE whatsapp_messages IS 'Log of WhatsApp messages sent';

-- ============================================
-- COMPLETION
-- ============================================

-- Grant necessary permissions (adjust as needed)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
