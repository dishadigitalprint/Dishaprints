-- =====================================================
-- Create Supabase Auth Users for Existing Database Users
-- =====================================================
-- This manually creates auth.users entries for existing public.users
-- Run this in Supabase SQL Editor

-- First, let's check what auth users exist
SELECT id, email, phone, created_at FROM auth.users;

-- Create auth user for admin with email (9876543210)
-- Note: You'll need to set a password when they first login
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    phone,
    phone_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '09f2aaf2-3ad8-4fd6-b2eb-0a524fc79f83', -- Existing user ID
    'authenticated',
    'authenticated',
    'admin@dishaprints.com',
    crypt('9876543210', gen_salt('bf')), -- Password is phone number
    NOW(),
    '+919876543210',
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Raju","phone":"9876543210"}',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    updated_at = NOW();

-- Update the second admin user with an email
UPDATE users 
SET email = 'admin2@dishaprints.com'
WHERE phone = '8121188835';

-- Create auth user for second admin (8121188835)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    phone,
    phone_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'cb0f41a3-df08-496b-abb3-4d16485c183e', -- Existing user ID
    'authenticated',
    'authenticated',
    'admin2@dishaprints.com',
    crypt('8121188835', gen_salt('bf')), -- Password is phone number
    NOW(),
    '+918121188835',
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Raju","phone":"8121188835"}',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    updated_at = NOW();

-- Verify the auth users were created
SELECT id, email, phone, email_confirmed_at FROM auth.users;

-- =====================================================
-- IMPORTANT: After running this script
-- =====================================================
-- Login credentials:
-- 1. Email: admin@dishaprints.com, Password: 9876543210
-- 2. Email: admin2@dishaprints.com, Password: 8121188835
