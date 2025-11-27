-- Drop existing table if needed
DROP TABLE IF EXISTS whatsapp_config;

-- Create whatsapp_config table for WhatsApp Business API credentials
CREATE TABLE whatsapp_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_url TEXT NOT NULL DEFAULT 'https://graph.facebook.com/v18.0',
    phone_number_id VARCHAR(100) NOT NULL,
    access_token TEXT NOT NULL,
    business_account_id VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_demo_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    description TEXT
);

-- Create indexes after table creation
CREATE INDEX idx_whatsapp_config_active ON whatsapp_config(is_active);

-- Comment
COMMENT ON TABLE whatsapp_config IS 'WhatsApp Business API configuration and credentials';

-- Insert demo configuration
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
);

SELECT 'whatsapp_config table created successfully!' AS status;
