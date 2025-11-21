-- ============================================
-- SUPABASE STORAGE BUCKETS SETUP
-- ============================================
-- Run this in your Supabase SQL Editor to create storage buckets
-- OR follow the manual steps in STORAGE-SETUP.md

-- 1. Create car-images bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'car-images',
  'car-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create driver-photos bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'driver-photos',
  'driver-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Set policies for car-images bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads to car-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for car-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from car-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to car-images" ON storage.objects;

-- Create new policies (allow public uploads for easier admin access)
CREATE POLICY "Allow public uploads to car-images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'car-images');

CREATE POLICY "Public read access for car-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'car-images');

CREATE POLICY "Allow authenticated deletes from car-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'car-images');

-- 4. Set policies for driver-photos bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads to driver-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for driver-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from driver-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to driver-photos" ON storage.objects;

-- Create new policies (allow public uploads for easier admin access)
CREATE POLICY "Allow public uploads to driver-photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'driver-photos');

CREATE POLICY "Public read access for driver-photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'driver-photos');

CREATE POLICY "Allow authenticated deletes from driver-photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'driver-photos');

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify buckets were created:
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id IN ('car-images', 'driver-photos');

-- You should see 2 rows with both buckets listed
