-- Quick Setup for Disha Digital Prints
-- Copy this entire file and run in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/noerqtwbyqeunjvnzlmg/editor

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    phone_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. OTP Table
CREATE TABLE IF NOT EXISTS otp_verification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(10) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT false,
    attempts INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_verification(phone);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_verification(expires_at);

-- 3. Addresses Table
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address_id UUID REFERENCES addresses(id),
    status VARCHAR(20) DEFAULT 'pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    gst DECIMAL(10, 2) NOT NULL,
    delivery_charge DECIMAL(10, 2) DEFAULT 0,
    cod_charge DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(20),
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_screenshot TEXT,
    transaction_id VARCHAR(100),
    delivery_method VARCHAR(20),
    estimated_delivery DATE,
    tracking_number VARCHAR(50),
    customer_notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- 5. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_type VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    configuration JSONB NOT NULL,
    file_url TEXT,
    file_name VARCHAR(255),
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 6. Activity Log Table
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    phone VARCHAR(10),
    name VARCHAR(100),
    action VARCHAR(255) NOT NULL,
    page VARCHAR(255),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);

-- 7. Cart Abandonment Table
CREATE TABLE IF NOT EXISTS cart_abandonment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(10) NOT NULL,
    name VARCHAR(100),
    cart_items JSONB NOT NULL,
    total_amount DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'abandoned',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. WhatsApp Messages Log
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_phone VARCHAR(15) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    template_name VARCHAR(100),
    message_content TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert admin user
INSERT INTO users (phone, name, email, role, phone_verified)
VALUES ('9876543210', 'Admin User', 'admin@dishaprints.com', 'admin', true)
ON CONFLICT (phone) DO NOTHING;

SELECT 'Database setup complete! 8 tables created.' AS status;
