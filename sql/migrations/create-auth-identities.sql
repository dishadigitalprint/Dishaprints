-- =====================================================
-- Create Missing Auth Identities
-- =====================================================
-- This creates the identity records that link auth users to email provider
-- Without these, login will fail with "Email logins are disabled"

-- Create identity for first admin (9876543210)
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    '09f2aaf2-3ad8-4fd6-b2eb-0a524fc79f83', -- Same as user ID
    '09f2aaf2-3ad8-4fd6-b2eb-0a524fc79f83', -- User ID
    jsonb_build_object(
        'sub', '09f2aaf2-3ad8-4fd6-b2eb-0a524fc79f83',
        'email', 'admin@dishaprints.com',
        'email_verified', true,
        'phone_verified', true
    ),
    'email',
    '09f2aaf2-3ad8-4fd6-b2eb-0a524fc79f83',
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE SET
    identity_data = EXCLUDED.identity_data,
    updated_at = NOW();

-- Create identity for second admin (8121188835)
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    'cb0f41a3-df08-496b-abb3-4d16485c183e', -- Same as user ID
    'cb0f41a3-df08-496b-abb3-4d16485c183e', -- User ID
    jsonb_build_object(
        'sub', 'cb0f41a3-df08-496b-abb3-4d16485c183e',
        'email', 'admin2@dishaprints.com',
        'email_verified', true,
        'phone_verified', true
    ),
    'email',
    'cb0f41a3-df08-496b-abb3-4d16485c183e',
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE SET
    identity_data = EXCLUDED.identity_data,
    updated_at = NOW();

-- Verify identities were created
SELECT user_id, provider, email, created_at FROM auth.identities;

-- =====================================================
-- DONE! Now you can login with:
-- =====================================================
-- 1. Email: admin@dishaprints.com, Phone: 9876543210
-- 2. Email: admin2@dishaprints.com, Phone: 8121188835
