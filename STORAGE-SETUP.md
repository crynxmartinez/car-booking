# Supabase Storage Setup for Car Images

## Quick Setup (1 minute)

1. **Go to Supabase Dashboard**
   - Visit: https://uslaqreqkxruomeyxnei.supabase.co
   - Click on **Storage** in the left sidebar

2. **Create New Bucket**
   - Click **"New bucket"**
   - Bucket name: `car-images`
   - **Make it PUBLIC** ✓ (Check the "Public bucket" option)
   - Click **"Create bucket"**

3. **Set Bucket Policies (Optional but Recommended)**
   - Click on the `car-images` bucket
   - Go to **Policies** tab
   - Add these policies:

   **INSERT Policy:**
   ```sql
   CREATE POLICY "Allow authenticated uploads"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'car-images');
   ```

   **SELECT Policy (for public access):**
   ```sql
   CREATE POLICY "Public read access"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'car-images');
   ```

   **DELETE Policy:**
   ```sql
   CREATE POLICY "Allow authenticated deletes"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'car-images');
   ```

## That's It!

Now when you add a car in the admin dashboard:
- Click **"Upload Image"** button
- Select a photo from your computer
- Image will be uploaded to Supabase Storage
- Preview will show immediately
- Image URL will be saved to the database

## Supported Formats
- JPG, JPEG
- PNG
- WebP
- Max size: 5MB (can be adjusted)

## Troubleshooting

**Error: "Bucket not found"**
- Make sure you created the bucket named exactly `car-images`
- Make sure it's set to PUBLIC

**Error: "Upload failed"**
- Check if the bucket is public
- Check if file size is under 5MB
- Check your internet connection
