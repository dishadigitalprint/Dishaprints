-- Create pricing_config table for dynamic product pricing
-- This table stores all configurable prices for printing services

CREATE TABLE IF NOT EXISTS pricing_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Print Rates (per page)
    bw_per_page DECIMAL(10, 2) DEFAULT 2.00,
    color_per_page DECIMAL(10, 2) DEFAULT 10.00,
    
    -- Paper Quality Multipliers
    standard_paper_multiplier DECIMAL(5, 2) DEFAULT 1.00,
    premium_paper_multiplier DECIMAL(5, 2) DEFAULT 1.50,
    glossy_paper_multiplier DECIMAL(5, 2) DEFAULT 2.00,
    
    -- Binding Prices
    binding_none DECIMAL(10, 2) DEFAULT 0.00,
    binding_staple DECIMAL(10, 2) DEFAULT 10.00,
    binding_spiral DECIMAL(10, 2) DEFAULT 50.00,
    binding_perfect DECIMAL(10, 2) DEFAULT 100.00,
    binding_hardcover DECIMAL(10, 2) DEFAULT 200.00,
    
    -- Cover Prices
    cover_none DECIMAL(10, 2) DEFAULT 0.00,
    cover_standard DECIMAL(10, 2) DEFAULT 20.00,
    cover_glossy DECIMAL(10, 2) DEFAULT 40.00,
    cover_laminated DECIMAL(10, 2) DEFAULT 60.00,
    
    -- Business Cards (per 100 cards)
    business_card_standard DECIMAL(10, 2) DEFAULT 200.00,
    business_card_premium DECIMAL(10, 2) DEFAULT 400.00,
    business_card_luxury DECIMAL(10, 2) DEFAULT 800.00,
    
    -- Brochures
    brochure_a4_per_page DECIMAL(10, 2) DEFAULT 15.00,
    brochure_a5_per_page DECIMAL(10, 2) DEFAULT 10.00,
    brochure_letter_per_page DECIMAL(10, 2) DEFAULT 12.00,
    
    -- Delivery & Service Charges
    delivery_charge_standard DECIMAL(10, 2) DEFAULT 80.00,
    delivery_charge_express DECIMAL(10, 2) DEFAULT 150.00,
    min_order_free_delivery DECIMAL(10, 2) DEFAULT 500.00,
    
    -- Tax
    gst_percentage DECIMAL(5, 2) DEFAULT 18.00,
    
    -- Bulk Discounts (pages threshold and discount %)
    bulk_discount_50_pages DECIMAL(5, 2) DEFAULT 5.00,
    bulk_discount_100_pages DECIMAL(5, 2) DEFAULT 10.00,
    bulk_discount_500_pages DECIMAL(5, 2) DEFAULT 15.00,
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_pricing_config_active ON pricing_config(is_active, effective_from DESC);

-- Ensure only one active config at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_pricing_config_one_active 
ON pricing_config(is_active) 
WHERE is_active = TRUE;

-- Insert default pricing configuration
INSERT INTO pricing_config (
    bw_per_page,
    color_per_page,
    binding_staple,
    binding_spiral,
    binding_perfect,
    cover_standard,
    cover_glossy,
    business_card_standard,
    brochure_a4_per_page,
    delivery_charge_standard,
    gst_percentage,
    updated_by
) VALUES (
    2.00,      -- B&W per page
    10.00,     -- Color per page
    10.00,     -- Staple binding
    50.00,     -- Spiral binding
    100.00,    -- Perfect binding
    20.00,     -- Standard cover
    40.00,     -- Glossy cover
    200.00,    -- Business cards (per 100)
    15.00,     -- A4 brochure per page
    80.00,     -- Standard delivery
    18.00,     -- GST 18%
    'system'   -- Updated by
) ON CONFLICT DO NOTHING;

-- Comment
COMMENT ON TABLE pricing_config IS 'Configurable pricing for all printing services with bulk discounts and delivery charges';

SELECT 'pricing_config table created successfully! Default prices inserted.' AS status;
