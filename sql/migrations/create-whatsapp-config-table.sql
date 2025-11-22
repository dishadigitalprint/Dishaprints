-- Create whatsapp_config table for WhatsApp Business API credentials
-- This table stores the API configuration needed for sending WhatsApp messages

CREATE TABLE IF NOT EXISTS whatsapp_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- API Configuration
    api_url TEXT NOT NULL DEFAULT 'https://graph.facebook.com/v18.0',
    phone_number_id VARCHAR(100) NOT NULL,
    access_token TEXT NOT NULL,
    business_account_id VARCHAR(100),
    
    -- Settings
    is_active BOOLEAN DEFAULT true,
    is_demo_mode BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    
    -- Notes
    description TEXT,
    
    -- Ensure only one active config
    CONSTRAINT only_one_active_config UNIQUE (is_active)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_whatsapp_config_active ON whatsapp_config(is_active) WHERE is_active = true;

-- Comment
COMMENT ON TABLE whatsapp_config IS 'WhatsApp Business API configuration and credentials';

-- Insert demo/placeholder config
INSERT INTO whatsapp_config (
    phone_number_id, 
    access_token, 
    business_account_id,
    is_active,
    is_demo_mode,
    description
) VALUES (
    'DEMO_PHONE_NUMBER_ID',
    'DEMO_ACCESS_TOKEN_REPLACE_WITH_REAL_TOKEN',
    'DEMO_BUSINESS_ACCOUNT_ID',
    true,
    true,
    'Demo configuration - Replace with real WhatsApp Business API credentials'
) ON CONFLICT (is_active) DO NOTHING;

SELECT 'whatsapp_config table created successfully!' AS status;
