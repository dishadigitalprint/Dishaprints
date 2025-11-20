-- =====================================================
-- SECURE AUTHENTICATION SCHEMA
-- This replaces localStorage-based auth with proper server-side authentication
-- Works with existing users table
-- =====================================================

-- 1. Drop existing policies to recreate with admin access
-- (RLS is already enabled on users table)

DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- 2. Create new secure policies for users table

-- Users can read their own data
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Users can update their own profile (but NOT their role)
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id 
        AND role = (SELECT role FROM users WHERE id = auth.uid()) -- Prevent role self-modification
    );

-- Only admins can update any user (including roles)
CREATE POLICY "Admins can update any user"
    ON users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 4. Create admin_access view for checking admin status
CREATE OR REPLACE VIEW admin_access AS
SELECT 
    id,
    phone,
    name,
    email,
    role,
    phone_verified,
    (role = 'admin') as is_admin
FROM users
WHERE id = auth.uid();

COMMENT ON VIEW admin_access IS 'Secure view for checking current user admin status';

-- 5. Function to verify admin access (server-side)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_admin IS 'Server-side function to verify admin role';

-- 6. Function to get current user with role
CREATE OR REPLACE FUNCTION get_current_user()
RETURNS TABLE (
    id UUID,
    phone VARCHAR,
    name VARCHAR,
    email VARCHAR,
    role VARCHAR,
    phone_verified BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.phone,
        u.name,
        u.email,
        u.role,
        u.phone_verified
    FROM users u
    WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_current_user IS 'Get current authenticated user profile with role';

-- 7. Trigger to prevent role self-modification
CREATE OR REPLACE FUNCTION prevent_role_self_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow admins to change roles, but users cannot change their own role
    IF NEW.id = auth.uid() AND OLD.role != NEW.role THEN
        -- Check if current user is admin
        IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') THEN
            RAISE EXCEPTION 'Cannot modify your own role. Contact an administrator.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_role_security
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION prevent_role_self_modification();

-- 8. Update RLS Policies for orders table to allow admin access
-- (orders table RLS already enabled)

DROP POLICY IF EXISTS "Users can insert own orders" ON orders;

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
    ON orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Recreate user order creation policy
CREATE POLICY "Users can insert own orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Only admins can update orders
CREATE POLICY "Admins can update orders"
    ON orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Only admins can delete orders
CREATE POLICY "Admins can delete orders"
    ON orders FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 9. RLS Policies for payment_settings (admin only)
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage payment settings"
    ON payment_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 10. RLS Policies for whatsapp_config (admin only)
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage whatsapp config"
    ON whatsapp_config FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 11. RLS Policies for base_pricing (admin only write, all read)
ALTER TABLE base_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view pricing"
    ON base_pricing FOR SELECT
    USING (true);

CREATE POLICY "Only admins can modify pricing"
    ON base_pricing FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 12. RLS Policies for product_config (admin only write, all read)
ALTER TABLE product_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view product config"
    ON product_config FOR SELECT
    USING (true);

CREATE POLICY "Only admins can modify product config"
    ON product_config FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 13. Set your account as admin (UPDATE THIS WITH YOUR ACTUAL PHONE)
-- Replace '9876543210' with your 10-digit phone number (without +91)
UPDATE users 
SET role = 'admin' 
WHERE phone = '9876543210'; -- ← Change this to your phone number

SELECT 'Secure authentication schema created successfully!' as status;
SELECT 'Admin role set for specified user!' as admin_status;
