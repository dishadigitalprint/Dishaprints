-- Announcements/Notifications Banner System
-- Run this in Supabase SQL Editor

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('discount', 'info', 'warning', 'success', 'urgent')),
    icon VARCHAR(50) DEFAULT 'fa-bullhorn',
    link_url VARCHAR(500),
    link_text VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_announcements_dates ON announcements(start_date, end_date);

COMMENT ON TABLE announcements IS 'System announcements, discounts, and notifications for homepage banner';

-- RLS Policies
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Public can view active announcements
CREATE POLICY "Public can view active announcements"
ON announcements FOR SELECT
USING (
    is_active = true 
    AND start_date <= NOW() 
    AND (end_date IS NULL OR end_date >= NOW())
);

-- Admin can do everything
CREATE POLICY "Admin full access to announcements"
ON announcements FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id::text = auth.uid()::text 
        AND users.role = 'admin'
    )
);

-- Insert sample announcements
INSERT INTO announcements (title, message, type, icon, link_url, link_text, display_order) VALUES
('🎉 Grand Opening Discount!', 'Get 20% OFF on all printing services this month. Use code: WELCOME20', 'discount', 'fa-tags', '/order.html', 'Order Now', 1),
('⚡ 2-Hour Express Printing', 'Need urgent prints? We deliver in just 2 hours within city limits!', 'success', 'fa-bolt', '/order.html', 'Try Express', 2),
('📢 New Services Available', 'Now offering custom business cards and brochures. Check our latest collection!', 'info', 'fa-bullhorn', '/order-business-cards.html', 'Explore', 3)
ON CONFLICT DO NOTHING;

SELECT '✅ Announcements table created successfully!' as status;
