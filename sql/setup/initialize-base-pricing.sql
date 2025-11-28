-- Initialize Base Pricing Table
-- Run this in Supabase SQL Editor if base_pricing table is empty

-- Check current data
SELECT 'Current base_pricing data:' as info;
SELECT * FROM base_pricing;

-- Insert or update base pricing data
INSERT INTO base_pricing (product_type, base_price, price_unit, min_quantity, description, gst_percentage) VALUES
('documents', 2.00, 'per page', 1, 'A4 document printing - base price per page', 18.00),
('business_cards', 300.00, 'per 100 cards', 100, 'Business cards - base price for 100 cards', 18.00),
('brochures', 8.00, 'per brochure', 50, 'Brochures - base price per brochure', 18.00)
ON CONFLICT (product_type) 
DO UPDATE SET 
    base_price = EXCLUDED.base_price,
    price_unit = EXCLUDED.price_unit,
    min_quantity = EXCLUDED.min_quantity,
    description = EXCLUDED.description,
    gst_percentage = EXCLUDED.gst_percentage,
    updated_at = NOW();

-- Verify data was inserted
SELECT 'Updated base_pricing data:' as info;
SELECT * FROM base_pricing ORDER BY product_type;

-- Check RLS policies (should allow admin access)
SELECT 'RLS Policies for base_pricing:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'base_pricing';

SELECT '✅ Base pricing initialization complete!' as status;
