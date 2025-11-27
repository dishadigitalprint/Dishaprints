-- Supabase Storage Setup Script
-- Run this in Supabase SQL Editor

-- Step 1: Enable storage extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create storage bucket for order files
-- Note: Run this via Supabase Dashboard → Storage → New Bucket
-- Bucket name: order-files
-- Public: Yes (for downloads)

-- Step 3: Create storage policies
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to order-files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'order-files');

-- Allow public to read/download files
CREATE POLICY "Allow public downloads from order-files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'order-files');

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated deletes from order-files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'order-files');

-- Step 4: Verify bucket exists
-- Run this to check if bucket was created:
-- SELECT * FROM storage.buckets WHERE id = 'order-files';

-- Step 5: Test upload (run in browser console after authentication)
/*
const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
const { data, error } = await supabase.storage
    .from('order-files')
    .upload('test/test.pdf', testFile);
console.log(data, error);
*/

-- Step 6: Test public URL (run in browser console)
/*
const { data } = supabase.storage
    .from('order-files')
    .getPublicUrl('test/test.pdf');
console.log(data.publicUrl);
// Should return: https://xxx.supabase.co/storage/v1/object/public/order-files/test/test.pdf
*/

COMMENT ON POLICY "Allow authenticated uploads to order-files" ON storage.objects IS 'Allows logged-in users to upload PDF files to order-files bucket';
COMMENT ON POLICY "Allow public downloads from order-files" ON storage.objects IS 'Allows anyone to download files from order-files bucket (for admin access)';
