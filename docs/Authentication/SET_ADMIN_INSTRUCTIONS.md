# How to Set Admin Role (Secure Method)

## ⚠️ Security Update
The previous localStorage-based authentication was insecure. We've implemented proper server-side authentication with Supabase.

## Problem
After logging in, you're getting "Access denied. Admin only." message when trying to access admin pages.

## ✅ Secure Solution
Admin role MUST be set in the database. Client-side role manipulation is no longer possible (security fix).

### Step 1: Apply Security Schema

First, apply the secure authentication schema to your Supabase database:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run the entire `secure-auth-schema.sql` file
3. This creates Row Level Security policies and admin verification functions

### Step 2: Set Admin Role in Database

To make a user admin, update their role in the database:

1. Go to Supabase Dashboard → SQL Editor
2. Run this query:

```sql
-- Update user role to admin by phone number
UPDATE users 
SET role = 'admin' 
WHERE phone = '+919876543210';  -- Replace with your phone number

-- Or update by email
UPDATE users 
SET role = 'admin' 
WHERE email = 'your@email.com';  -- Replace with your email
```

## Verify Admin Access

After setting admin role, check by running in console:

```javascript
const user = JSON.parse(localStorage.getItem('userSession'));
console.log('User role:', user.role);  // Should show "admin"
```

## Admin Navigation

Once admin role is set, you'll see these pages in the header:
- 📊 Dashboard
- 🛒 Orders
- 👥 Customers  
- 🏭 Production
- 📦 Inventory
- 🛍️ Cart History
- ⚙️ Settings
- 📜 Activity Log

## Troubleshooting

### Still seeing "Access denied"?
1. Clear browser cache and localStorage:
```javascript
localStorage.clear();
sessionStorage.clear();
```
2. Login again
3. Set admin role again using Method 1

### Role not persisting?
- The role is stored in localStorage only
- After logout, you'll need to set it again (unless you use Method 3 - Database)
- Method 3 is recommended for permanent admin access

### Pages redirect to login?
- Make sure `phoneVerified` and `loggedIn` are both `true` in userSession
- Check your session:
```javascript
console.log(JSON.parse(localStorage.getItem('userSession')));
```

Should look like:
```json
{
  "loggedIn": true,
  "phoneVerified": true,
  "phone": "+919876543210",
  "name": "Your Name",
  "email": "your@email.com",
  "role": "admin"  // ← This must be "admin"
}
```
