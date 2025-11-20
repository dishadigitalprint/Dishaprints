# GitHub Pages Deployment Guide

## Repository
**URL**: https://github.com/dishadigitalprint/Dishaprints

## Your Site Will Be Live At
```
https://dishadigitalprint.github.io/Dishaprints/
```

## Deployment Steps

### 1. Add Remote Repository
```bash
cd c:\ai\Disha\dishaPrints
git remote add origin https://github.com/dishadigitalprint/Dishaprints.git
```

### 2. Add All Files
```bash
git add .
```

### 3. Commit Changes
```bash
git commit -m "Initial deployment with SEO optimization"
```

### 4. Push to GitHub
```bash
git push -u origin master
```

### 5. Enable GitHub Pages
1. Go to: https://github.com/dishadigitalprint/Dishaprints/settings/pages
2. Under "Build and deployment":
   - **Source**: Select "GitHub Actions"
3. The workflow will automatically deploy your site

### 6. Wait for Deployment
- Check Actions tab: https://github.com/dishadigitalprint/Dishaprints/actions
- First deployment takes 2-5 minutes
- Green checkmark = successful deployment

## Important: Update URLs After First Deployment

Once deployed, update all SEO URLs from `https://dishaprints.com/` to:
```
https://dishadigitalprint.github.io/Dishaprints/
```

### Files to Update:
1. `src/index.html` - All canonical URLs and Open Graph URLs
2. `src/track-order.html` - Canonical and OG URLs
3. `src/order-documents.html` - Canonical and OG URLs
4. `src/order-business-cards.html` - Canonical and OG URLs
5. `src/order-brochures.html` - Canonical and OG URLs

## Custom Domain (Optional)

If you want `dishaprints.com` instead of the GitHub URL:

### 1. Buy Domain
- Namecheap, GoDaddy, or any registrar

### 2. Configure DNS
Add these records to your domain DNS:
```
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
CNAME www   dishadigitalprint.github.io
```

### 3. Add Custom Domain in GitHub
1. Go to: https://github.com/dishadigitalprint/Dishaprints/settings/pages
2. Under "Custom domain", enter: `dishaprints.com`
3. Check "Enforce HTTPS"

### 4. Wait for DNS Propagation (24-48 hours)

## Troubleshooting

### Pages Not Found (404)
- Ensure GitHub Pages source is set to "GitHub Actions"
- Check that workflow ran successfully in Actions tab

### Styles Not Loading
- Check browser console for errors
- Ensure all paths are relative (no leading `/` for CDN links)

### Images Not Showing
- Verify images are in `src/images/` folder
- Check image paths in HTML

## Monitoring

### Check Deployment Status
```bash
# See latest deployment
https://github.com/dishadigitalprint/Dishaprints/deployments
```

### View Build Logs
```bash
# Check Actions for errors
https://github.com/dishadigitalprint/Dishaprints/actions
```

## Updating Your Site

After making changes locally:
```bash
git add .
git commit -m "Update description"
git push
```

The site will automatically redeploy in 2-5 minutes.

## Security Notes

### ⚠️ Important: Supabase Keys
Your `src/js/supabase-config.js` contains:
- Supabase URL
- Supabase Anon Key

**These will be publicly visible on GitHub!**

#### What to Do:
1. **Anon Key is safe** - It's designed to be public
2. **Enable Row Level Security (RLS)** - Already configured
3. **Never commit service role keys** - Don't have them in code

#### Additional Security:
Add this to your Supabase project settings:
1. Go to: Settings > API
2. Add allowed domains:
   - `https://dishadigitalprint.github.io`
   - Your custom domain (if using)

## Performance Tips

### 1. Add .gitignore
Already exists, but ensure it excludes:
```
node_modules/
.env
*.log
.DS_Store
```

### 2. Optimize Images
Before pushing, compress images:
- Use TinyPNG or ImageOptim
- Target: < 200KB per image

### 3. Enable Caching
GitHub Pages automatically caches static assets.

## Next Steps After Deployment

- [ ] Verify site loads at GitHub Pages URL
- [ ] Test all pages and navigation
- [ ] Update SEO URLs to match GitHub Pages URL
- [ ] Create social media images
- [ ] Test on mobile devices
- [ ] Submit sitemap to Google Search Console
- [ ] Set up Google Analytics

---

**Ready to Deploy?** Run the git commands above! 🚀
