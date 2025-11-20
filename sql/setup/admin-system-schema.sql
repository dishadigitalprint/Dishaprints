-- ============================================
-- Admin System Enhancement - Additional Tables
-- ============================================

-- 1. Inventory Management Table
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_type VARCHAR(50) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL,
    low_stock_threshold DECIMAL(10, 2) DEFAULT 10,
    cost_price DECIMAL(10, 2),
    selling_price DECIMAL(10, 2),
    supplier_name VARCHAR(255),
    supplier_contact VARCHAR(20),
    last_restocked TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_type ON inventory(item_type);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON inventory(quantity);

COMMENT ON TABLE inventory IS 'Track inventory items like paper, ink, materials';

-- 2. Inventory Transactions Table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment')),
    quantity DECIMAL(10, 2) NOT NULL,
    previous_quantity DECIMAL(10, 2),
    new_quantity DECIMAL(10, 2),
    reason TEXT,
    order_id UUID REFERENCES orders(id),
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_trans_inventory ON inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inv_trans_created ON inventory_transactions(created_at DESC);

-- 3. Daily Reports Table
CREATE TABLE IF NOT EXISTS daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL UNIQUE,
    total_orders INT DEFAULT 0,
    total_revenue DECIMAL(10, 2) DEFAULT 0,
    total_profit DECIMAL(10, 2) DEFAULT 0,
    orders_pending INT DEFAULT 0,
    orders_processing INT DEFAULT 0,
    orders_completed INT DEFAULT 0,
    orders_cancelled INT DEFAULT 0,
    new_customers INT DEFAULT 0,
    returning_customers INT DEFAULT 0,
    payment_collected DECIMAL(10, 2) DEFAULT 0,
    payment_pending DECIMAL(10, 2) DEFAULT 0,
    top_product VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date DESC);

-- 4. Customer Notes Table
CREATE TABLE IF NOT EXISTS customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    note_type VARCHAR(20) CHECK (note_type IN ('general', 'complaint', 'feedback', 'follow-up')),
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_notes_user ON customer_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_created ON customer_notes(created_at DESC);

-- 5. Production Queue Table
CREATE TABLE IF NOT EXISTS production_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES order_items(id),
    priority INT DEFAULT 0,
    assigned_to VARCHAR(100),
    estimated_completion TIMESTAMPTZ,
    actual_completion TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'in-progress', 'quality-check', 'completed', 'on-hold')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prod_queue_status ON production_queue(status);
CREATE INDEX IF NOT EXISTS idx_prod_queue_order ON production_queue(order_id);
CREATE INDEX IF NOT EXISTS idx_prod_queue_priority ON production_queue(priority DESC);

-- 6. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_date DATE NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(20),
    vendor_name VARCHAR(255),
    receipt_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- 7. Customer Lifetime Value View
CREATE OR REPLACE VIEW customer_lifetime_value AS
SELECT 
    u.id as user_id,
    u.phone,
    u.name,
    u.email,
    u.created_at as customer_since,
    COUNT(DISTINCT o.id) as total_orders,
    SUM(o.total) as lifetime_value,
    AVG(o.total) as avg_order_value,
    MAX(o.created_at) as last_order_date,
    CASE 
        WHEN MAX(o.created_at) >= NOW() - INTERVAL '30 days' THEN 'active'
        WHEN MAX(o.created_at) >= NOW() - INTERVAL '90 days' THEN 'at-risk'
        ELSE 'inactive'
    END as customer_status
FROM users u
LEFT JOIN orders o ON u.id = o.user_id AND o.status != 'cancelled'
GROUP BY u.id, u.phone, u.name, u.email, u.created_at;

-- 8. Today's Summary View
CREATE OR REPLACE VIEW todays_summary AS
SELECT 
    COUNT(DISTINCT o.id) as total_orders,
    SUM(o.total) as total_revenue,
    COUNT(DISTINCT o.user_id) as unique_customers,
    COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending_orders,
    COUNT(CASE WHEN o.status = 'processing' THEN 1 END) as processing_orders,
    COUNT(CASE WHEN o.status = 'ready' THEN 1 END) as ready_orders,
    COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered_orders,
    COUNT(CASE WHEN o.payment_status = 'paid' THEN 1 END) as paid_orders,
    COUNT(CASE WHEN o.payment_status = 'pending' THEN 1 END) as payment_pending,
    SUM(CASE WHEN o.payment_status = 'paid' THEN o.total ELSE 0 END) as collected_amount,
    SUM(CASE WHEN o.payment_status = 'pending' THEN o.total ELSE 0 END) as pending_amount
FROM orders o
WHERE DATE(o.created_at) = CURRENT_DATE;

-- 9. Low Stock Alert View
CREATE OR REPLACE VIEW low_stock_alert AS
SELECT 
    id,
    item_type,
    item_name,
    quantity,
    unit,
    low_stock_threshold,
    ROUND((quantity / low_stock_threshold) * 100) as stock_percentage
FROM inventory
WHERE quantity <= low_stock_threshold
ORDER BY stock_percentage ASC;

-- 10. Production Status View
CREATE OR REPLACE VIEW production_status AS
SELECT 
    pq.id,
    pq.order_id,
    o.order_number,
    o.created_at as order_date,
    u.name as customer_name,
    u.phone as customer_phone,
    oi.product_name,
    oi.quantity,
    pq.status,
    pq.priority,
    pq.assigned_to,
    pq.estimated_completion,
    pq.notes
FROM production_queue pq
JOIN orders o ON pq.order_id = o.id
JOIN users u ON o.user_id = u.id
JOIN order_items oi ON pq.order_item_id = oi.id
WHERE pq.status != 'completed'
ORDER BY pq.priority DESC, o.created_at ASC;

-- 11. Revenue Report Function
CREATE OR REPLACE FUNCTION get_revenue_report(
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    order_date DATE,
    total_orders BIGINT,
    total_revenue NUMERIC,
    avg_order_value NUMERIC,
    unique_customers BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(o.created_at) as order_date,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.total) as total_revenue,
        AVG(o.total) as avg_order_value,
        COUNT(DISTINCT o.user_id) as unique_customers
    FROM orders o
    WHERE DATE(o.created_at) BETWEEN start_date AND end_date
        AND o.status != 'cancelled'
    GROUP BY DATE(o.created_at)
    ORDER BY order_date DESC;
END;
$$ LANGUAGE plpgsql;

-- 12. Update Order Status Trigger
CREATE OR REPLACE FUNCTION update_production_queue_on_order_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'processing' AND OLD.status != 'processing' THEN
        UPDATE production_queue
        SET status = 'in-progress', updated_at = NOW()
        WHERE order_id = NEW.id AND status = 'queued';
    ELSIF NEW.status = 'ready' THEN
        UPDATE production_queue
        SET status = 'completed', actual_completion = NOW(), updated_at = NOW()
        WHERE order_id = NEW.id AND status != 'completed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_production_queue ON orders;
CREATE TRIGGER trigger_update_production_queue
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_production_queue_on_order_status();

-- 13. Auto-create Production Queue on Order
CREATE OR REPLACE FUNCTION create_production_queue_on_order()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO production_queue (order_id, order_item_id, priority, status)
    SELECT NEW.id, id, 0, 'queued'
    FROM order_items
    WHERE order_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_production_queue ON orders;
CREATE TRIGGER trigger_create_production_queue
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION create_production_queue_on_order();

-- 14. Sample Inventory Data
INSERT INTO inventory (item_type, item_name, description, quantity, unit, low_stock_threshold, cost_price, selling_price, supplier_name, supplier_contact)
VALUES 
    ('paper', 'A4 Paper 80GSM', 'Standard A4 white paper 80GSM', 5000, 'sheets', 1000, 0.50, 2.00, 'Paper Suppliers India', '9876543210'),
    ('paper', 'A4 Paper 130GSM', 'Premium A4 white paper 130GSM', 3000, 'sheets', 500, 1.00, 3.00, 'Paper Suppliers India', '9876543210'),
    ('paper', 'Business Card Stock 300GSM', 'Premium card stock for business cards', 2000, 'sheets', 300, 2.50, 8.00, 'Card Stock Pro', '9876543211'),
    ('ink', 'Black Ink Cartridge', 'High capacity black ink', 50, 'units', 10, 500.00, 0, 'Ink Solutions', '9876543212'),
    ('ink', 'Color Ink Set CMYK', 'Full color ink set', 30, 'sets', 5, 2000.00, 0, 'Ink Solutions', '9876543212'),
    ('materials', 'Spiral Binding Coils', 'Plastic spiral binding coils', 500, 'pieces', 50, 5.00, 20.00, 'Binding Supplies', '9876543213'),
    ('materials', 'Lamination Sheets A4', 'Clear lamination sheets', 1000, 'sheets', 100, 3.00, 10.00, 'Lamination World', '9876543214')
ON CONFLICT DO NOTHING;

-- 15. Product Configuration Table
CREATE TABLE IF NOT EXISTS product_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_type VARCHAR(50) NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    display_label VARCHAR(255),
    price_modifier DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_type, config_key, config_value)
);

CREATE INDEX IF NOT EXISTS idx_product_config_type ON product_config(product_type);
CREATE INDEX IF NOT EXISTS idx_product_config_key ON product_config(config_key);
CREATE INDEX IF NOT EXISTS idx_product_config_active ON product_config(is_active);

COMMENT ON TABLE product_config IS 'Configuration for product options like paper types, sizes, finishes with pricing';

-- 16. Base Pricing Table
CREATE TABLE IF NOT EXISTS base_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_type VARCHAR(50) NOT NULL UNIQUE,
    base_price DECIMAL(10, 2) NOT NULL,
    price_unit VARCHAR(50) NOT NULL,
    min_quantity INT DEFAULT 1,
    gst_percentage DECIMAL(5, 2) DEFAULT 5.00,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_base_pricing_type ON base_pricing(product_type);

COMMENT ON TABLE base_pricing IS 'Base pricing for each product type';

-- 17. Sample Product Configuration Data
INSERT INTO product_config (product_type, config_key, config_value, display_label, price_modifier, sort_order) VALUES
-- Document Printing - Paper Sizes
('documents', 'paper_size', 'A4', 'A4 (210 x 297 mm)', 0, 1),
('documents', 'paper_size', 'A5', 'A5 (148 x 210 mm)', -0.50, 2),
('documents', 'paper_size', 'Letter', 'Letter (216 x 279 mm)', 0.50, 3),
('documents', 'paper_size', 'Legal', 'Legal (216 x 356 mm)', 1.00, 4),

-- Document Printing - Paper Types
('documents', 'paper_type', '80gsm', '80 GSM Standard', 0, 1),
('documents', 'paper_type', '100gsm', '100 GSM Premium', 0.50, 2),
('documents', 'paper_type', '130gsm', '130 GSM Glossy', 1.00, 3),

-- Document Printing - Color Options
('documents', 'color', 'bw', 'Black & White', 0, 1),
('documents', 'color', 'color', 'Full Color', 1.50, 2),

-- Document Printing - Sides
('documents', 'sides', 'single', 'Single Sided', 0, 1),
('documents', 'sides', 'double', 'Double Sided', 0.50, 2),

-- Document Printing - Binding
('documents', 'binding', 'none', 'No Binding', 0, 1),
('documents', 'binding', 'staple', 'Staple Binding', 5.00, 2),
('documents', 'binding', 'spiral', 'Spiral Binding', 25.00, 3),
('documents', 'binding', 'tape', 'Tape Binding', 15.00, 4),

-- Business Cards - Materials
('business_cards', 'material', 'standard', 'Standard Card Stock', 0, 1),
('business_cards', 'material', 'premium', 'Premium Card Stock', 50.00, 2),
('business_cards', 'material', 'plastic', 'Plastic PVC', 150.00, 3),

-- Business Cards - Finish
('business_cards', 'finish', 'matte', 'Matte Finish', 0, 1),
('business_cards', 'finish', 'glossy', 'Glossy Finish', 20.00, 2),
('business_cards', 'finish', 'uv', 'UV Spot Finish', 50.00, 3),

-- Business Cards - Corners
('business_cards', 'corners', 'square', 'Square Corners', 0, 1),
('business_cards', 'corners', 'rounded', 'Rounded Corners', 15.00, 2),

-- Brochures - Paper Types
('brochures', 'paper_type', '130gsm', '130 GSM Glossy', 0, 1),
('brochures', 'paper_type', '170gsm', '170 GSM Art Card', 2.00, 2),
('brochures', 'paper_type', '210gsm', '210 GSM Premium', 3.00, 3),

-- Brochures - Finish
('brochures', 'finish', 'matte', 'Matte Lamination', 0, 1),
('brochures', 'finish', 'glossy', 'Glossy Lamination', 1.00, 2),
('brochures', 'finish', 'none', 'No Lamination', -1.00, 3)
ON CONFLICT DO NOTHING;

-- 18. Sample Base Pricing Data
INSERT INTO base_pricing (product_type, base_price, price_unit, min_quantity, description) VALUES
('documents', 2.00, 'per page', 1, 'A4 document printing - base price per page'),
('business_cards', 300.00, 'per 100 cards', 100, 'Business cards - base price for 100 cards'),
('brochures', 8.00, 'per brochure', 50, 'Brochures - base price per brochure')
ON CONFLICT DO NOTHING;

-- 19. Create Admin User (if not exists)
INSERT INTO users (phone, name, email, role, phone_verified)
VALUES ('9876543210', 'Admin User', 'admin@dishaprints.com', 'admin', true)
ON CONFLICT (phone) DO UPDATE SET role = 'admin';

SELECT 'Admin system tables created successfully!' as status;
