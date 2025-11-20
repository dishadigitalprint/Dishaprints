# Disha Digital Prints - Project Structure

## 📁 Directory Organization

```
dishaPrints/
├── src/                          # Frontend source files
│   ├── *.html                    # All HTML pages (landing, order, checkout, admin, etc.)
│   ├── js/                       # JavaScript modules
│   │   ├── supabase-config.js    # Supabase client configuration
│   │   ├── supabase-db.js        # Database utilities
│   │   ├── auth-utils.js         # Authentication utilities
│   │   ├── login.js              # Login/signup flow
│   │   ├── cart.js               # Shopping cart logic
│   │   ├── order-*.js            # Order flow scripts
│   │   ├── checkout-*.js         # Checkout flow scripts
│   │   ├── admin-*.js            # Admin panel scripts
│   │   ├── razorpay-service.js   # Razorpay payment integration
│   │   └── whatsapp-service.js   # WhatsApp notifications
│   └── css/                      # Stylesheets
│
├── sql/                          # Database scripts
│   ├── setup/                    # Initial database setup
│   │   ├── supabase-schema.sql           # Main database schema
│   │   ├── admin-system-schema.sql       # Admin system tables
│   │   ├── razorpay-schema.sql           # Razorpay payment tables
│   │   ├── payment-settings-schema.sql   # Payment configuration
│   │   ├── secure-auth-schema.sql        # Authentication tables
│   │   └── quick-setup.sql               # Quick start script
│   └── migrations/               # Database migrations
│       ├── create-auth-users.sql         # Auth users setup
│       ├── create-auth-identities.sql    # Auth identities setup
│       └── fix-rls-policies.sql          # RLS policy fixes
│
├── docs/                         # Documentation
│   ├── README.md                         # Main project documentation
│   ├── QUICKSTART.md                     # Quick start guide
│   ├── SETUP_GUIDE.md                    # Detailed setup instructions
│   ├── IMPLEMENTATION_COMPLETE.md        # Implementation status
│   ├── IMPLEMENTATION_SUMMARY.md         # Feature summary
│   ├── PROGRESS.md                       # Development progress
│   ├── TESTING_CHECKLIST.md              # Testing guidelines
│   │
│   ├── Authentication/
│   │   ├── AUTHENTICATION_FLOW.md        # Auth flow documentation
│   │   ├── USER_AND_ADMIN_FLOWS.md       # User journey flows
│   │   └── SET_ADMIN_INSTRUCTIONS.md     # Admin setup steps
│   │
│   ├── Admin System/
│   │   ├── ADMIN_SETUP_GUIDE.md          # Admin panel setup
│   │   └── ADMIN_SYSTEM_SUMMARY.md       # Admin features overview
│   │
│   ├── Payments/
│   │   ├── RAZORPAY_QUICKSTART.md        # Razorpay quick start
│   │   ├── RAZORPAY_SETUP_GUIDE.md       # Razorpay detailed setup
│   │   └── RAZORPAY_IMPLEMENTATION.md    # Razorpay technical docs
│   │
│   ├── Features/
│   │   ├── CART_TRACKING_COMPLETE.md         # Cart implementation
│   │   ├── DYNAMIC_PRICING_IMPLEMENTATION.md # Pricing system
│   │   ├── WHATSAPP_SETUP.md                 # WhatsApp integration
│   │   └── WHATSAPP_CONFIG_IMPLEMENTATION.md # WhatsApp config
│   │
│   └── Supabase/
│       ├── SUPABASE_INTEGRATION.md           # Supabase setup
│       └── SUPABASE_INTEGRATION_COMPLETE.md  # Supabase completion
│
├── .github/
│   └── copilot-instructions.md   # GitHub Copilot configuration
│
├── tailwind.config.js            # Tailwind CSS configuration
└── PROJECT_STRUCTURE.md          # This file

```

## 🚀 Quick Start

1. **Database Setup**: Run scripts in `sql/setup/` folder in order
2. **Configuration**: Update Supabase credentials in `src/js/supabase-config.js`
3. **Frontend**: Open `src/index.html` in browser or deploy to hosting
4. **Documentation**: See `docs/QUICKSTART.md` for detailed instructions

## 📚 Key Documentation

- **Getting Started**: `docs/QUICKSTART.md`
- **Full Setup**: `docs/SETUP_GUIDE.md`
- **Authentication**: `docs/AUTHENTICATION_FLOW.md`
- **Admin Panel**: `docs/ADMIN_SETUP_GUIDE.md`
- **Razorpay Payments**: `docs/RAZORPAY_QUICKSTART.md`
- **Testing**: `docs/TESTING_CHECKLIST.md`

## 🗄️ Database Schema

### Core Tables (supabase-schema.sql)
- `users` - User accounts and profiles
- `addresses` - Delivery addresses
- `products` - Product catalog
- `orders` - Customer orders
- `order_items` - Order line items
- `cart` - Shopping cart items
- `activity_log` - User activity tracking

### Admin System (admin-system-schema.sql)
- `admin_users` - Admin accounts
- `admin_activity_log` - Admin actions
- `print_queue` - Production queue
- `inventory` - Product inventory

### Payments (razorpay-schema.sql)
- `razorpay_config` - API configuration
- `razorpay_payments` - Payment transactions
- `razorpay_webhooks` - Webhook events

## 🎨 Design System

- **Landing Page**: Vibrant blue/orange branding (index.html only)
- **Application Pages**: Edu Dashboard design system (all other pages)
- **Configuration**: `tailwind.config.js`
- **Guidelines**: `.github/copilot-instructions.md`

## 🔑 Current Status

### ✅ Completed Features
- User authentication (phone OTP + email)
- Product catalog (documents, business cards, brochures)
- Shopping cart with persistence
- Multi-step checkout flow
- Order management
- Admin dashboard with KPIs
- Razorpay payment integration (test mode)
- WhatsApp notifications
- Dynamic pricing system

### ⚠️ In Progress
- Authentication system simplification (bypassing Supabase Auth temporarily)
- RLS policies (currently disabled, need re-enabling)
- Razorpay testing and configuration

### 📋 TODO
- Execute Razorpay schema (`sql/setup/razorpay-schema.sql`)
- Configure Razorpay API keys (test mode)
- Test payment flow end-to-end
- Re-enable RLS policies with proper rules
- Production deployment preparation

## 🔧 Configuration Files

- **Supabase**: `src/js/supabase-config.js` - Update with your Supabase URL and anon key
- **Tailwind**: `tailwind.config.js` - Design tokens and theme configuration
- **WhatsApp**: Admin number configured as +919700653332

## 🧪 Testing

See `docs/TESTING_CHECKLIST.md` for comprehensive testing guidelines including:
- Responsive design testing
- Authentication flow testing
- Order placement testing
- Payment gateway testing
- Admin panel testing

## 📞 Support

For issues or questions:
1. Check relevant documentation in `docs/` folder
2. Review implementation summaries
3. Check SQL scripts for database-related issues
4. Review auth flow documentation for login issues

---

**Last Updated**: November 2025
**Version**: 1.0 (Razorpay Integration Complete)
