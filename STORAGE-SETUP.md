# Supabase Storage Setup for Images

## Quick Setup (2 minutes)

You need to create **2 buckets** for car images and driver photos.

### 1. Go to Supabase Dashboard
- Visit: https://uslaqreqkxruomeyxnei.supabase.co
- Click on **Storage** in the left sidebar

### 2. Create Car Images Bucket
- Click **"New bucket"**
- Bucket name: `car-images`
- **Make it PUBLIC** ✓ (Check the "Public bucket" option)
- Click **"Create bucket"**

### 3. Create Driver Photos Bucket
- Click **"New bucket"** again
- Bucket name: `driver-photos`
- **Make it PUBLIC** ✓ (Check the "Public bucket" option)
- Click **"Create bucket"**

### 4. Set Bucket Policies (Optional but Recommended)

**For car-images bucket:**
- Click on the `car-images` bucket → **Policies** tab
- Add these policies:

```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'car-images');

CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'car-images');

CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'car-images');
```

**For driver-photos bucket:**
- Click on the `driver-photos` bucket → **Policies** tab
- Add these policies:

```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'driver-photos');

CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'driver-photos');

CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'driver-photos');
```

## That's It!

Now when you add cars or drivers in the admin dashboard:

**For Cars:**
- Click **"Upload Image"** button
- Select a photo from your computer
- Image will be uploaded to Supabase Storage
- Preview will show immediately
- Image URL will be saved to the database

**For Drivers:**
- Click **"Upload Photo"** button
- Select driver's photo from your computer
- Photo will be uploaded to Supabase Storage
- Circular preview will show immediately
- Photo URL will be saved to the database

## Supported Formats
- JPG, JPEG
- PNG
- WebP
- Max size: 5MB (can be adjusted)

## Troubleshooting

**Error: "Bucket not found"**
- Make sure you created both buckets: `car-images` and `driver-photos`
- Make sure both are set to PUBLIC

**Error: "Upload failed"**
- Check if the bucket is public
- Check if file size is under 5MB
- Check your internet connection
