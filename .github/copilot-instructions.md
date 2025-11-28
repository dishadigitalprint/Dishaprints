# GitHub Copilot Instructions - Disha Digital Prints

You are the **primary implementation agent** for the project **"Disha Digital Prints"**.

Your job is to **implement features end-to-end** for a Supabase-backed JAMstack e-commerce app **without asking the human to run database or CLI commands**, except when an operation is clearly destructive (drop table, delete data, etc.).

---

## 1. Project Overview

**Architecture**

- Frontend: `HTML5 + Vanilla JavaScript + Tailwind CSS`
- Hosting: `GitHub Pages` (static)
- Backend: `Supabase` (PostgreSQL + REST + Realtime)
- Auth: Custom Phone OTP using `localStorage` sessions (not Supabase Auth)
- Payments: `Razorpay` (test → later live)
- Notifications: `WhatsApp Business API`
- Style systems:
  - Landing pages → vibrant **blue / orange** marketing style
  - App pages (customer + admin) → clean **Edu Dashboard** style

**High-Level Flows**

- **Customer Flow**
  - Landing: `index.html`
  - Product flows: `order-documents.html`, `order-business-cards.html`, `order-brochures.html`, etc.
  - Upload files, configure options (paper, color, binding, quantity).
  - Cart stored in `sessionStorage` and synced to Supabase.
  - Multi-step checkout: address → payment → confirmation.
- **Admin Flow**
  - Separate admin dashboard for:
    - Orders, print queue, inventory
    - Pricing & product config
    - Payment & WhatsApp configuration
    - Analytics, KPIs, customer insights

---

## 2. Database & Supabase Rules

**Supabase is the single backend.** No extra Node/Express server should be introduced.

Schemas (conceptual groups):

- **Core tables**
  - `users`, `addresses`
  - `products`, `orders`, `order_items`, `cart`
  - `activity_log`
- **Admin / Ops**
  - `admin_users`, `admin_activity_log`
  - `print_queue`, `inventory`
- **Payments**
  - `razorpay_config`, `razorpay_payments`, `razorpay_webhooks`
- **Configuration**
  - `payment_settings`, `whatsapp_config`
  - `base_pricing`, `product_config`

**RLS & roles**

- Admin: `role = 'admin'` → full access.
- Normal user: can only see/update **their own** rows (by `user_id` / `phone`).

## Design System Split

### 🎨 Landing Page Design (index.html ONLY)
**DO NOT MODIFY** the landing page design tokens. It uses:
- **Primary Color**: `#0000FF` (Pure Blue)
- **Accent Color**: `#FFA500` (Orange)
- **Typography**: Inter from Google Fonts
- **Style**: Bold, vibrant, marketing-focused with gradients
- **Existing Tailwind classes**: Keep as-is

### 🎨 Application Pages Design (All Other Pages)
Use **Edu Dashboard design tokens** defined in `tailwind.config.js`:

#### Colors
```js
// Primary Brand
primary-600: #1E6CE0  // Main brand color
primary-500: #2F85FF  // Lighter variant
primary-700: #1554B3  // Darker variant

// Neutrals (Gray scale)
neutral-0: #FFFFFF    // Pure white
neutral-50: #F9FAFB   // Page background
neutral-100: #F2F4F7  // Subtle backgrounds
neutral-200: #E5E7EB  // Borders
neutral-600: #4B5563  // Secondary text
neutral-800: #1F2937  // Primary text
neutral-900: #111827  // Darkest text

// Accents
accentA-500: #22C55E  // Success green
accentA-600: #16A34A  // Success green dark
accentB-500: #FB923C  // Warning orange
danger-500: #EF4444   // Error red
info-500: #3B82F6     // Info blue
```

#### Typography
```js
// Font Families
font-sans: Inter, Plus Jakarta Sans, system-ui
font-mono: JetBrains Mono (for numbers/prices)

// Font Sizes
text-xs: 12px
text-sm: 14px
text-base: 16px
text-lg: 18px
text-xl: 20px
text-2xl: 24px
text-3xl: 28px
text-4xl: 32px
text-5xl: 40px

// Font Weights
font-regular: 400
font-medium: 500
font-semibold: 600
font-bold: 700
```

#### Spacing
```js
// Use design token spacing (not default Tailwind)
1: 2px   |  7: 24px
2: 4px   |  8: 32px
3: 8px   |  9: 40px
4: 12px  | 10: 48px
5: 16px  | 11: 56px
6: 20px  | 12: 64px

// Common patterns
gap-7: 24px    // Section gaps
gap-8: 32px    // Large gaps
p-7: 24px      // Card padding
p-8: 32px      // Modal padding
```

#### Border Radius
```js
rounded-xs: 6px
rounded-sm: 8px
rounded-md: 12px   // Inputs, buttons
rounded-lg: 16px   // Cards
rounded-xl: 24px   // Large cards
rounded-full: 9999px // Pills, badges
```

#### Shadows (Elevation)
```js
shadow-xs: subtle
shadow-sm: small cards
shadow-md: cards (default)
shadow-lg: cards on hover, modals
```

## Component Patterns

### Card Component
```html
<div class="card card-hover">
  <!-- OR manually: -->
  <div class="bg-white rounded-lg shadow-md p-8 border border-subtle hover:shadow-lg transition-base">
    <h3 class="text-xl font-semibold text-primary-text">Title</h3>
    <p class="text-sm text-secondary-text">Description</p>
  </div>
</div>
```

### Button Components
```html
<!-- Primary -->
<button class="btn btn-primary h-button-md px-5">
  Order Now
</button>

<!-- Secondary -->
<button class="btn btn-secondary h-button-md px-5">
  Save Draft
</button>

<!-- Ghost -->
<button class="btn btn-ghost h-button-md px-5">
  Cancel
</button>
```

### Input Components
```html
<input 
  type="text" 
  class="input w-full"
  placeholder="Enter details"
/>

<!-- OR manually: -->
<input 
  type="text"
  class="h-input rounded-md border border-subtle focus:border-primary-600 focus:ring-primary-300 px-5"
/>
```

### Badge Components
```html
<span class="badge badge-success">Active</span>
<span class="badge badge-info">Processing</span>
<span class="badge badge-warn">Pending</span>
<span class="badge badge-error">Failed</span>
```

### KPI Tile (For Pricing Display)
```html
<div class="kpi-tile">
  <p class="text-sm text-secondary-text mb-2">Total Price</p>
  <p class="kpi-value">₹250</p>
  <p class="text-xs text-accentA-600 mt-2 flex items-center gap-1">
    <i class="fas fa-arrow-up"></i> 15% savings
  </p>
</div>
```

### Form Layout
```html
<div class="space-y-7">
  <div>
    <label class="block text-sm font-medium text-primary-text mb-2">
      Label
    </label>
    <input type="text" class="input w-full" />
  </div>
</div>
```

## Page Structure Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title - Disha Digital Prints</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="../tailwind.config.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="bg-page font-sans">
  <!-- Header -->
  <header class="bg-white border-b border-subtle h-topbar">
    <!-- Navigation -->
  </header>

  <!-- Main Content -->
  <main class="max-w-container mx-auto px-7 py-9">
    <!-- Page content with gap-7 or gap-8 between sections -->
  </main>

  <!-- Footer -->
  <footer class="bg-neutral-800 text-white py-9">
    <!-- Footer content -->
  </footer>

  <script src="js/main.js"></script>
</body>
</html>
```

## Responsive Breakpoints
Use design token breakpoints:
```js
xs: 360px   // Small phones
sm: 640px   // Phones
md: 768px   // Tablets
lg: 1024px  // Small laptops
xl: 1280px  // Desktop
2xl: 1536px // Large desktop
```

## Animation & Transitions
```js
// Durations
transition-fast: 120ms    // Quick hover effects
transition-base: 200ms    // Default transitions
transition-slow: 320ms    // Smooth animations

// Easing
ease-standard: cubic-bezier(0.2, 0, 0, 1)
ease-emphasized: cubic-bezier(0.2, 0, 0, 1.2)
```

## File Upload Pattern
```html
<div class="border-2 border-dashed border-subtle rounded-md p-8 text-center hover:border-primary-300 transition-base cursor-pointer">
  <i class="fas fa-cloud-upload-alt text-4xl text-neutral-400 mb-4"></i>
  <p class="text-base text-primary-text">Drag & drop files here</p>
  <p class="text-sm text-secondary-text mt-2">or click to browse</p>
  <input type="file" class="hidden" multiple />
</div>
```

## Accessibility
- Always include `aria-label` for icon-only buttons
- Use semantic HTML (`<button>`, `<nav>`, `<main>`, `<header>`, `<footer>`)
- Ensure focus states are visible (already in `.input` and `.btn` classes)
- Maintain color contrast ratios (design tokens are WCAG AA compliant)

## JavaScript Patterns
```js
// Use design token values
const TRANSITION_FAST = 120;
const TRANSITION_BASE = 200;
const TRANSITION_SLOW = 320;

// File validation
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword'];

// Price calculation
function calculatePrice(config) {
  const basePrice = PRODUCT_PRICES[config.productType];
  const multiplier = config.quantity * config.pages;
  return basePrice * multiplier;
}
```

## Files to Generate

### Order Flow
1. `order.html` - Product selection + upload
2. `checkout-address.html` - Delivery address
3. `checkout-payment.html` - Payment method
4. `order-confirmation.html` - Success screen

### Account Pages
5. `my-account.html` - User profile
6. `my-orders.html` - Order history

### Admin Pages
7. `admin-login.html` - Admin authentication
8. `admin-dashboard.html` - KPIs and metrics
9. `admin-orders.html` - Order management
10. `admin-print-queue.html` - Production queue

## Code Quality Rules
- ✅ Use semantic class names from design tokens
- ✅ Prefer Tailwind utility classes over custom CSS
- ✅ Keep components consistent across pages
- ✅ Use design token values (don't hardcode colors/spacing)
- ✅ Mobile-first responsive design
- ✅ Optimize for performance (defer scripts, lazy load images)
- ❌ Don't mix landing page colors with app page colors
- ❌ Don't create custom CSS unless absolutely necessary
- ❌ Don't use inline styles

## Testing Checklist
Before marking a page complete:
- [ ] Renders correctly at all breakpoints (xs to 2xl)
- [ ] All interactive elements have hover/focus states
- [ ] Form validation works and shows error states
- [ ] Loading states are implemented for async actions
- [ ] Color contrast meets WCAG AA standards
- [ ] Touch targets are at least 44x44px
- [ ] Keyboard navigation works properly
- [ ] Screen reader announcements are clear

---

**Remember**: Landing page = Bold blue/orange marketing. App pages = Clean neutral/primary dashboard aesthetic.
