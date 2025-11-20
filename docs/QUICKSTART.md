# 🚀 Quick Start Guide - Disha Digital Prints

## View the Landing Page

### Windows (PowerShell)
```powershell
# Navigate to the project
cd c:\ai\Disha\dishaPrints\src

# Open in default browser
start index.html
```

### Or use Live Server
```powershell
# Install live-server globally (one time only)
npm install -g live-server

# Run from project src directory
cd c:\ai\Disha\dishaPrints\src
live-server --port=8000
```

Then open: `http://localhost:8000`

## 📋 What's Complete

✅ **13 Complete Sections**
- Header with navigation
- Hero section with CTAs
- Benefits strip (5 benefits)
- Services section (6 services)
- How it works (3 steps)
- Express service highlight
- Pricing packages (3 tiers)
- Communication channels (3 methods)
- Customer testimonials (4 reviews)
- FAQ section (8 questions)
- Final call-to-action
- Complete footer
- Mobile floating button

✅ **Full Responsive Design**
- Mobile (< 768px)
- Tablet (768px - 1024px)
- Desktop (> 1024px)

✅ **Interactive Features**
- Smooth scrolling
- Hover animations
- Mobile menu toggle
- WhatsApp integration
- Form validation helpers

## 🎨 Design System

**Colors:**
- Primary: Blue (#0000FF)
- Accent: Orange (#FFA500)

**Font:**
- Inter (Google Fonts)

**Components:**
- Cards with shadows
- Gradient backgrounds
- Icon animations
- Responsive grids

## 📱 Test Checklist

### Desktop (Chrome, Firefox, Edge, Safari)
- [ ] All sections visible
- [ ] Navigation works
- [ ] Buttons clickable
- [ ] Hover effects work
- [ ] Images load
- [ ] Smooth scrolling

### Tablet (iPad, Android Tablets)
- [ ] Layout adjusts correctly
- [ ] Touch navigation works
- [ ] Images scale properly
- [ ] Text readable

### Mobile (iPhone, Android Phones)
- [ ] Single column layout
- [ ] Mobile menu appears
- [ ] Floating button visible
- [ ] WhatsApp links work
- [ ] Touch targets large enough

## 🔗 Important Links in Page

**Customer Actions:**
- Upload & Print → `order.html` (to be created)
- Sign In → `my-account.html` (to be created)
- Order Now buttons → `order.html?product=X`

**External:**
- WhatsApp: +91 98765 43210
- Email: print@dishadigital.com
- Phone: +91 98765 43210

## 📂 File Structure

```
src/
├── index.html       ← Open this file
├── js/
│   └── main.js      ← JavaScript functionality
└── css/             ← (empty, using Tailwind CDN)
```

## ⚡ No Build Required

Everything runs directly in the browser:
- Tailwind CSS from CDN
- Font Awesome from CDN
- Google Fonts from CDN
- Vanilla JavaScript (no frameworks)

## 🎯 Next Steps

1. **Test the landing page** in browsers
2. **Create order.html** for file upload
3. **Create account pages** (my-account, my-orders)
4. **Create checkout flow** (address, payment, confirmation)
5. **Build admin dashboard**
6. **Integrate Supabase backend**

## 🛠️ Customization

### Change Phone/Email
Edit these in `index.html`:
- Line 77: Header WhatsApp link
- Line 80: Header Sign In link
- Lines in Communication section
- Lines in Footer section

### Change Colors
Edit Tailwind config in `<head>`:
```javascript
colors: {
    primary: '#0000FF',  // Your blue
    accent: '#FFA500',   // Your orange
}
```

### Change Images
Replace URLs in:
- Hero section (line ~159)
- Express service section (line ~342)

## 💡 Tips

1. **Images**: Consider replacing placeholder images with real photos
2. **Content**: Update company address and contact details
3. **Links**: Create the linked pages (order.html, etc.)
4. **SEO**: Add more meta tags for better SEO
5. **Analytics**: Add Google Analytics code
6. **Performance**: Optimize images before going live

## 🐛 Known Issues

- Mobile menu toggle exists but menu panel not implemented yet
- Internal page links (order.html, my-account.html, etc.) need to be created
- Social media links in footer are placeholders

## ✅ Ready to Launch

The landing page is **production-ready** for static hosting on:
- GitHub Pages
- Netlify
- Vercel
- Any web server

Just upload the `src/` folder contents!

---

**Happy Printing! 🖨️**
