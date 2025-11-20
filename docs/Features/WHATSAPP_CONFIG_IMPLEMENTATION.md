# WhatsApp Configuration Implementation

## Overview
WhatsApp API credentials are now configurable from the admin panel instead of being hardcoded in JavaScript. This enables non-technical admins to update credentials without touching code files.

## Database Schema

### Table: `whatsapp_config`
Located in: `payment-settings-schema.sql`

```sql
CREATE TABLE IF NOT EXISTS whatsapp_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number_id VARCHAR(100) NOT NULL,
    access_token TEXT NOT NULL,
    api_version VARCHAR(10) DEFAULT 'v18.0',
    business_phone_number VARCHAR(20) NOT NULL,
    admin_phone_number VARCHAR(20) NOT NULL,
    silent_notifications BOOLEAN DEFAULT true,
    enable_login_notifications BOOLEAN DEFAULT true,
    enable_cart_notifications BOOLEAN DEFAULT true,
    enable_order_notifications BOOLEAN DEFAULT true,
    enable_payment_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Fields:**
- `phone_number_id` - Meta Business Phone Number ID
- `access_token` - WhatsApp Business API access token (System token)
- `api_version` - Graph API version (v17.0, v18.0, v19.0)
- `business_phone_number` - Your WhatsApp Business number (with country code)
- `admin_phone_number` - Number to receive admin notifications
- `silent_notifications` - Send login/cart notifications without sound
- `enable_login_notifications` - Toggle login notifications
- `enable_cart_notifications` - Toggle cart add notifications
- `enable_order_notifications` - Toggle order placement notifications (with sound)
- `enable_payment_notifications` - Toggle payment status notifications (with sound)

## Admin UI

### Location
**Admin Settings Page** > **WhatsApp Config** tab
File: `src/admin-settings.html`

### Features

#### 1. API Configuration
- **Phone Number ID**: Input field for Meta Business Phone Number ID
- **Access Token**: Password field with show/hide toggle
- **API Version**: Dropdown selector (v17.0, v18.0, v19.0)
- **Business Phone Number**: Your WhatsApp Business number
- **Admin Phone Number**: Number to receive notifications

#### 2. Notification Preferences
Toggle switches for:
- 🔇 Silent Notifications (login/cart without sound)
- 🔐 Login Notifications
- 🛒 Cart Add Notifications
- 📦 Order Notifications (with sound)
- 💳 Payment Notifications (with sound)

#### 3. Actions
- **Save Configuration**: Validates and saves to database
- **Test Connection**: Sends test message to verify credentials

### Form Validation
- Required field checks (Phone Number ID, Access Token, phone numbers)
- Phone number format validation (international format: +919876543210)
- Real-time field validation with focus management

## JavaScript Implementation

### File: `src/js/admin-settings.js`

#### Functions Added

##### 1. `loadWhatsAppConfig()`
```javascript
async function loadWhatsAppConfig()
```
- Fetches existing configuration from `whatsapp_config` table
- Populates form fields with database values
- Called automatically on page load

##### 2. `saveWhatsAppConfig()`
```javascript
async function saveWhatsAppConfig()
```
- Validates all form inputs
- Saves configuration to database (upsert)
- Shows success/error feedback
- Reloads WhatsApp service with new config

##### 3. `testWhatsAppConnection()`
```javascript
async function testWhatsAppConnection()
```
- Tests credentials without saving
- Sends test message to admin phone
- Shows detailed error messages on failure
- Provides troubleshooting guidance

##### 4. `toggleTokenVisibility()`
```javascript
function toggleTokenVisibility()
```
- Toggles access token field between password/text
- Updates eye icon (fa-eye ↔ fa-eye-slash)

### File: `src/js/whatsapp-service.js`

#### Enhanced Features

##### `loadConfig()` Method
```javascript
async loadConfig()
```
- Reads configuration from Supabase `whatsapp_config` table
- Updates `this.config` object with database values
- Sets `configLoaded` flag on success
- Updates `apiUrl` with loaded credentials

##### `notifyAdmin()` Enhancement
- Respects `silent_notifications` setting from database
- Checks notification type toggles (login, cart, order, payment)
- Only sends notifications if corresponding toggle is enabled

## Integration Flow

### 1. Page Load
```
admin-settings.html loads
↓
init() called
↓
loadWhatsAppConfig() fetches from database
↓
Form fields populated
```

### 2. Save Configuration
```
Admin fills form
↓
Click "Save Configuration"
↓
saveWhatsAppConfig() validates inputs
↓
Upsert to whatsapp_config table
↓
WhatsApp service reloads config
↓
Success feedback shown
```

### 3. Test Connection
```
Admin clicks "Test Connection"
↓
testWhatsAppConnection() reads current form values
↓
Sends test message via Meta Graph API
↓
Success/error feedback shown
```

### 4. WhatsApp Service Usage
```
Order page loads
↓
whatsapp-service.js initializes
↓
loadConfig() fetches from database
↓
User adds item to cart
↓
notifyAdmin() checks toggles
↓
Sends notification if enabled
```

## Security Features

1. **Access Token Protection**
   - Stored as password field (hidden by default)
   - Toggle visibility button for admin verification
   - Stored as TEXT in database (encrypted at rest by Supabase)

2. **Validation**
   - Required field checks prevent saving incomplete config
   - Phone number format validation (international E.164 format)
   - Token format validation on test connection

3. **Row Level Security**
   - Supabase RLS policies control access to `whatsapp_config` table
   - Only authenticated admin users can read/write

## Usage Instructions

### For Admins

1. **Get WhatsApp Credentials**
   - Go to [Meta Business Suite](https://business.facebook.com)
   - Navigate to WhatsApp Business Account
   - Get Phone Number ID from Phone Numbers section
   - Generate System Access Token from Business Settings

2. **Configure in Admin Panel**
   - Login to admin panel
   - Go to Settings > WhatsApp Config tab
   - Fill in all required fields
   - Set notification preferences
   - Click "Test Connection" to verify
   - Click "Save Configuration" when successful

3. **Update Credentials**
   - Meta tokens expire periodically
   - Return to WhatsApp Config tab
   - Update Access Token
   - Test and save again

### Troubleshooting

**Test Connection Failed:**
- ✓ Phone Number ID is correct
- ✓ Access Token is valid and not expired
- ✓ Business phone number is verified in Meta Business Suite
- ✓ Admin phone number is in international format (+919876543210)
- ✓ WhatsApp Business API is active

**Notifications Not Arriving:**
- Check toggle switches are enabled
- Verify admin phone number is correct
- Check Meta Business Suite message logs
- Ensure sufficient WhatsApp API quota

## Benefits

✅ **Non-Technical Configuration**: Admins can update credentials without code access  
✅ **Security**: Credentials stored in secure database, not in Git  
✅ **Flexibility**: Easy token rotation when expired  
✅ **Testing**: Test connection before saving  
✅ **Fine-Grained Control**: Individual toggles for each notification type  
✅ **User Experience**: Silent notifications for non-critical events  

## Database Migration

To apply this schema to your Supabase database:

```sql
-- Run this SQL in Supabase SQL Editor
-- File: payment-settings-schema.sql (lines 181-233)

CREATE TABLE IF NOT EXISTS whatsapp_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number_id VARCHAR(100) NOT NULL,
    access_token TEXT NOT NULL,
    api_version VARCHAR(10) DEFAULT 'v18.0',
    business_phone_number VARCHAR(20) NOT NULL,
    admin_phone_number VARCHAR(20) NOT NULL,
    silent_notifications BOOLEAN DEFAULT true,
    enable_login_notifications BOOLEAN DEFAULT true,
    enable_cart_notifications BOOLEAN DEFAULT true,
    enable_order_notifications BOOLEAN DEFAULT true,
    enable_payment_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_whatsapp_config_updated_at 
    BEFORE UPDATE ON whatsapp_config
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default placeholder values
INSERT INTO whatsapp_config (
    phone_number_id, 
    access_token, 
    api_version,
    business_phone_number, 
    admin_phone_number,
    silent_notifications,
    enable_login_notifications,
    enable_cart_notifications,
    enable_order_notifications,
    enable_payment_notifications
)
VALUES (
    'YOUR_PHONE_NUMBER_ID', 
    'YOUR_ACCESS_TOKEN', 
    'v18.0',
    '+919876543210', 
    '+919876543210',
    true,
    true,
    true,
    true,
    true
)
ON CONFLICT DO NOTHING;
```

## Files Modified

1. ✅ `payment-settings-schema.sql` - Added whatsapp_config table
2. ✅ `src/js/whatsapp-service.js` - Added loadConfig() method
3. ✅ `src/admin-settings.html` - Added WhatsApp Config tab
4. ✅ `src/js/admin-settings.js` - Added CRUD functions

## Testing Checklist

- [ ] Database schema applied successfully
- [ ] Admin panel loads without errors
- [ ] WhatsApp Config tab shows form
- [ ] Form fields populate with existing data
- [ ] Save button validates required fields
- [ ] Save button updates database
- [ ] Test connection sends message
- [ ] Toggle switches work correctly
- [ ] Access token show/hide toggle works
- [ ] Phone number format validation works
- [ ] WhatsApp service loads config on page load
- [ ] Login notifications work (if enabled)
- [ ] Cart notifications work (if enabled)
- [ ] Silent mode respects toggle setting

## Next Steps

1. Apply database schema to Supabase
2. Test admin UI in browser
3. Configure real WhatsApp credentials
4. Test connection with real credentials
5. Verify notifications on order pages
6. Document for team handoff
