# 🚀 Quick Start Guide - File Management System

## ⚡ 5-Minute Setup

### **Step 1: Create Supabase Storage Bucket** (2 mins)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **Storage** in sidebar
4. Click **"New Bucket"**
5. Name: `order-files`
6. **Public bucket:** ✅ YES
7. Click **Create**

### **Step 2: Set Storage Policies** (1 min)

Click on the `order-files` bucket → **Policies** tab → **New Policy**

**Policy 1: Allow Uploads**
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'order-files');
```

**Policy 2: Allow Downloads**
```sql
CREATE POLICY "Allow public downloads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'order-files');
```

**Policy 3: Allow Deletes**
```sql
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'order-files');
```

### **Step 3: Run Database Migration** (1 min)

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **"New Query"**
3. Copy & paste content from: `sql/migrations/add-file-management-features.sql`
4. Click **Run**
5. Should see: ✅ Success

### **Step 4: Update Admin HTML Files** (1 min)

Add these script tags to `admin-orders.html` before `</body>`:

```html
<!-- Add before existing scripts -->
<script src="js/storage-manager.js"></script>

<!-- Your existing scripts -->
<script src="js/admin-orders.js"></script>
```

### **Step 5: Test Upload** (Browser Console)

1. Open `order-upload.html` in browser
2. Open DevTools Console (F12)
3. Upload a test PDF
4. Check console for: `✅ File uploaded: ...`
5. Go to Supabase → Storage → order-files
6. Should see: `orders/timestamp-filename.pdf`

---

## 🧪 **Testing Checklist**

### **Upload Flow:**
- [ ] Open `src/order-upload.html`
- [ ] Upload 2-3 PDFs
- [ ] See toast: "Uploading files to cloud storage..."
- [ ] See toast: "✅ Files uploaded! Redirecting to cart..."
- [ ] Verify files in cart have `fileUrl` property

### **Admin Download:**
- [ ] Place an order with uploaded files
- [ ] Open admin orders page
- [ ] Click on order
- [ ] See file list with Download buttons
- [ ] Click Download → File downloads

### **Admin Delete:**
- [ ] Click Delete button on a file
- [ ] Confirm deletion
- [ ] See toast: "✅ File deleted! Storage space freed."
- [ ] Refresh page → File marked as deleted
- [ ] Check Supabase Storage → File removed

### **Storage Usage:**
- [ ] Open browser console
- [ ] Run: `await StorageManager.getStorageUsage()`
- [ ] Should show: `{ activeMB: "X.XX", usagePercent: "X.X%" }`

### **WhatsApp Notification:**
- [ ] Update order status to "ready"
- [ ] Customer receives WhatsApp message
- [ ] Message includes order number, amount, pickup details

---

## 🔍 **Troubleshooting**

### **Issue: "Bucket order-files does not exist"**
**Solution:**
1. Go to Supabase Dashboard → Storage
2. Create bucket named exactly: `order-files` (lowercase, with hyphen)
3. Make sure "Public bucket" is checked

### **Issue: "Upload failed: 403 Forbidden"**
**Solution:**
1. Check storage policies are created
2. Make sure user is authenticated before upload
3. Verify bucket permissions in Supabase Dashboard

### **Issue: "File download gives 404"**
**Solution:**
1. Check file URL format: `https://xxx.supabase.co/storage/v1/object/public/order-files/orders/...`
2. Verify "Allow public downloads" policy exists
3. Make bucket public in Supabase Dashboard

### **Issue: "Files not appearing in admin"**
**Solution:**
1. Check `order_items` table has `file_url` column
2. Run migration: `add-file-management-features.sql`
3. Verify cart items have `files` array with `fileUrl` property

---

## 📱 **WhatsApp Setup (Optional)**

### **Required for Order Notifications:**

1. **Create Meta Business Account:**
   - Go to [Meta Business Manager](https://business.facebook.com)
   - Create business account
   - Add WhatsApp Business API

2. **Create Message Templates:**
   - Go to WhatsApp Manager → Message Templates
   - Create template: `order_ready`
   - Create template: `order_delivered`
   - Wait for approval (24-48 hours)

3. **Get API Credentials:**
   - Phone Number ID: Found in WhatsApp Manager
   - Access Token: Generate in App Settings

4. **Update Database:**
   ```sql
   INSERT INTO whatsapp_config (
       phone_number_id,
       access_token,
       business_phone_number,
       admin_phone_number
   ) VALUES (
       'YOUR_PHONE_NUMBER_ID',
       'YOUR_ACCESS_TOKEN',
       '+919876543210',
       '+919876543210'
   );
   ```

5. **Test Notification:**
   ```javascript
   await whatsappService.sendOrderReadyNotification({
       customerName: 'Test Customer',
       customerPhone: '+919876543210',
       orderNumber: 'DDP20251127001',
       total: 250,
       itemCount: 2,
       deliveryMethod: 'pickup'
   });
   ```

---

## 🎉 **You're Done!**

Your system now:
- ✅ Uploads files to cloud storage
- ✅ Allows admin to download/delete files
- ✅ Tracks storage usage
- ✅ Auto-cleans old files
- ✅ Sends WhatsApp notifications (if configured)
- ✅ Works on GitHub Pages

**Next:** Deploy to GitHub Pages and test with real orders!

**Total Setup Time:** 5 minutes  
**Difficulty:** ⭐ Easy (just copy-paste!)
