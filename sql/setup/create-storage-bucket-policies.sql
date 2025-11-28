-- Quick Storage Bucket Setup
-- Run this in Supabase SQL Editor

-- Note: Bucket creation must be done via Dashboard UI
-- But you can verify and create policies here

-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'order-files';

-- If bucket doesn't exist, create it via Dashboard first, then run these policies:

-- Policy 1: Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'order-files');

-- Policy 2: Allow everyone to download (for admin access)
CREATE POLICY "Allow public downloads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'order-files');

-- Policy 3: Allow authenticated users to delete
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'order-files');

-- Verify policies are created
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%order-files%';
