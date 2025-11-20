# Dynamic Pricing & Configuration Implementation

## Overview
The admin panel configuration changes now **automatically reflect** on user-facing order pages. All pricing, dropdown options, and product configurations are loaded dynamically from the Supabase database.

## What Was Changed

### 1. New File: `config-loader.js`
A centralized configuration loader that:
- ✅ Fetches base pricing from `base_pricing` table
- ✅ Fetches product configurations from `product_config` table
- ✅ Caches configuration data for performance
- ✅ Provides helper functions to get prices and modifiers
- ✅ Automatically populates dropdowns with database values

**Location**: `src/js/config-loader.js`

### 2. Updated Order Pages
All three order pages now use dynamic configuration:

#### **Documents Page** (`order-documents.js`)
- ✅ Loads base price per page from database
- ✅ Populates dropdowns: Paper Size, Color Mode, Print Sides, Paper Quality
- ✅ Loads binding options (radio buttons) from database
- ✅ Applies price modifiers for color, paper type, sides, and binding
- ✅ Uses dynamic GST rate from database

#### **Business Cards Page** (`order-business-cards.js`)
- ✅ Loads base price from database
- ✅ Populates dropdowns: Material, Finish, Corners, Print Sides
- ✅ Applies price modifiers for material, finish, corners, and sides
- ✅ Uses dynamic GST rate from database

#### **Brochures Page** (`order-brochures.js`)
- ✅ Loads base price per brochure from database
- ✅ Populates dropdowns: Paper Type, Finish
- ✅ Applies price modifiers for paper type and finish
- ✅ Uses dynamic GST rate from database

### 3. HTML Updates
Added `config-loader.js` script to all order pages:
- `order-documents.html`
- `order-business-cards.html`
- `order-brochures.html`

## Database Tables Used

### `base_pricing` Table
Stores base prices for each product type:
```sql
- product_type: 'documents', 'business_cards', 'brochures'
- base_price: Starting price (e.g., ₹2 per page)
- price_unit: Description (e.g., 'per page', 'per 100 cards')
- gst_percentage: GST rate (default 5%)
```

### `product_config` Table
Stores configuration options with price modifiers:
```sql
- product_type: Which product this applies to
- config_key: Category (e.g., 'paper_type', 'color', 'binding')
- config_value: Option value (e.g., '80gsm', 'color', 'spiral')
- display_label: User-friendly label
- price_modifier: Price adjustment (+/- from base)
- is_active: Enable/disable options
- sort_order: Display order
```

## How It Works

### Admin Flow
1. Admin logs into admin panel (`admin-settings.html`)
2. Admin modifies:
   - Base prices in "Base Pricing" tab
   - Product options in "Product Configuration" tab
3. Admin clicks "Save All Changes"
4. Changes are saved to Supabase database

### User Flow
1. User visits order page (documents/business-cards/brochures)
2. Page automatically loads configuration from database
3. Dropdowns are populated with active options
4. Prices are calculated using database values
5. User sees **real-time admin pricing** without page reload needed

## Example Configuration Flow

### Scenario: Admin Changes Paper Quality Price

**Before**:
- 130gsm paper: Base + ₹1.00

**Admin Action**:
```javascript
// Admin changes in admin-settings.html
"130gsm Premium" → Price Modifier: ₹2.50
```

**After** (User sees immediately on next page load):
- 130gsm paper: Base + ₹2.50
- Dropdown shows: "130 GSM Glossy" (+₹2.50)
- Price calculation uses new ₹2.50 modifier

## Fallback Behavior

If database is unavailable:
- ✅ Pages show warning toast: "Using default pricing"
- ✅ Hardcoded fallback values are used
- ✅ User can still complete orders
- ⚠️ Prices may not reflect admin changes

## Testing Checklist

### Admin Panel
- [ ] Can modify base prices
- [ ] Can add/edit/delete product options
- [ ] Can set price modifiers
- [ ] Save button works
- [ ] Changes persist after page reload

### User Pages - Documents
- [ ] Base price loads from database
- [ ] Paper size dropdown populated
- [ ] Color mode dropdown populated
- [ ] Paper quality dropdown populated
- [ ] Binding options show with prices
- [ ] Price calculation uses modifiers
- [ ] GST calculates correctly

### User Pages - Business Cards
- [ ] Base price loads from database
- [ ] Material dropdown populated
- [ ] Finish dropdown populated
- [ ] Corners dropdown populated
- [ ] Price calculation uses modifiers
- [ ] GST calculates correctly

### User Pages - Brochures
- [ ] Base price loads from database
- [ ] Paper type dropdown populated
- [ ] Finish dropdown populated
- [ ] Price calculation uses modifiers
- [ ] GST calculates correctly

## Configuration API

### Load Configuration
```javascript
// Initialize for a product type
await ConfigLoader.initializeForProduct('documents');

// Get base price
const basePrice = ConfigLoader.getBasePrice('documents');

// Get GST rate
const gstRate = ConfigLoader.getGSTRate('documents');

// Get price modifier
const modifier = ConfigLoader.getPriceModifier('documents', 'color', 'color');

// Get all options
const options = ConfigLoader.getConfigOptions('documents', 'paper_type');

// Populate dropdown
ConfigLoader.populateDropdown(selectElement, 'documents', 'paper_size');
```

## Benefits

### ✅ For Admin
- Change prices once, reflect everywhere
- Add/remove product options easily
- Control pricing strategy centrally
- No code changes needed

### ✅ For Users
- Always see current pricing
- Consistent experience
- No stale cached prices
- Accurate cost estimates

### ✅ For Developers
- Single source of truth
- Easy to maintain
- Centralized configuration
- No hardcoded values

## Future Enhancements

Possible improvements:
1. **Real-time Updates**: Use Supabase realtime subscriptions
2. **Bulk Pricing**: Quantity-based discounts from database
3. **Seasonal Pricing**: Time-based pricing rules
4. **User-Specific Pricing**: Custom pricing for loyal customers
5. **A/B Testing**: Test different pricing strategies
6. **Price History**: Track pricing changes over time

## Troubleshooting

### Dropdowns Not Populating
- Check if `config-loader.js` is loaded before order page script
- Verify `product_config` table has data for product type
- Check browser console for errors

### Prices Not Matching Admin Panel
- Verify admin clicked "Save All Changes"
- Check if changes saved to database (view Supabase dashboard)
- Clear browser cache and reload page
- Check `is_active = true` for configurations

### Default Prices Still Showing
- Verify Supabase connection is working
- Check network tab for failed API calls
- Ensure `base_pricing` table has data
- Check browser console for initialization errors

## Database Seeding

To populate initial configuration, run:
```sql
-- Already included in admin-system-schema.sql
-- Sample data for documents, business_cards, brochures
-- See lines 17-18 in admin-system-schema.sql
```

## Summary

🎉 **Configuration is now fully dynamic!** Admin panel changes automatically reflect on user pages without any code deployment needed. The system fetches pricing and options from the database on every page load, ensuring users always see the most current configuration.
