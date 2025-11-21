# 🚗 Car Booking System - Complete Setup Guide

## 📋 Prerequisites
- Supabase account
- GitHub account (for deployment)
- Vercel account (for hosting)

---

## 🗄️ Step 1: Database Setup

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase Dashboard: https://uslaqreqkxruomeyxnei.supabase.co
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `database-setup.sql`
5. Click **Run** (or press Ctrl+Enter)
6. Wait for "Success. No rows returned" message

### Option B: Manual Table Creation
Follow the schema in `database-setup.sql` to create tables manually.

---

## 📦 Step 2: Storage Buckets Setup

You need to create 2 storage buckets for car images and driver photos.

### Option A: Using SQL (Fastest - 30 seconds)

1. Go to **SQL Editor** in Supabase
2. Copy and paste the contents of `storage-buckets-setup.sql`
3. Click **Run**
4. Verify by running the verification query at the bottom

### Option B: Manual Creation (2 minutes)

1. Go to **Storage** in Supabase sidebar
2. Click **New bucket**
3. Create first bucket:
   - Name: `car-images`
   - ✅ Check **"Public bucket"**
   - Click **Create**
4. Create second bucket:
   - Name: `driver-photos`
   - ✅ Check **"Public bucket"**
   - Click **Create**

📖 **Detailed guide:** See `STORAGE-SETUP.md`

---

## 🔄 Step 3: Update Database Schema (If Upgrading)

If you're upgrading from an older version, run:

```sql
-- In Supabase SQL Editor
-- Copy contents from database-update.sql
```

This adds:
- `trip_type` column (within_city / outside_city)
- `duration_hours` column (6, 12, or 24)

---

## 🚀 Step 4: Deploy to Vercel

### First Time Deployment

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "Initial setup"
   git push origin main
   ```

2. Go to [Vercel Dashboard](https://vercel.com)
3. Click **Add New** → **Project**
4. Import your GitHub repository
5. Configure:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Click **Deploy**

### Automatic Deployments
- Every push to `main` branch automatically deploys to Vercel
- No manual deployment needed!

---

## 🔑 Step 5: Default Admin Login

Access the admin panel at: `your-domain.vercel.app/admin/login`

**Default Credentials:**
- Username: `admin`
- Password: `admin`

⚠️ **IMPORTANT:** Change the password after first login!

---

## ✅ Verification Checklist

After setup, verify everything works:

### Database
- [ ] All tables created (bookings, cars, drivers, admins)
- [ ] Default admin user exists
- [ ] Row Level Security policies active

### Storage
- [ ] `car-images` bucket exists and is public
- [ ] `driver-photos` bucket exists and is public
- [ ] Storage policies are set

### Application
- [ ] Homepage loads
- [ ] Booking form opens
- [ ] Calendar displays correctly
- [ ] Admin login works
- [ ] Can add cars with image upload
- [ ] Can add drivers with photo upload
- [ ] Kanban board displays
- [ ] Drag and drop works

---

## 🎯 Quick Test Flow

1. **Homepage** → Click "Book Now"
2. **Select Date** → Click any future date
3. **Select Time** → Choose a time from dropdown
4. **Choose Car** → Select any available car
5. **Trip Type** → Choose "Within City" or "Outside City"
6. **Duration** → Select 6, 12, or 24 hours
7. **Driver** → Choose "Drive Solo" or select a driver
8. **Your Info** → Fill in details
9. **Confirm** → Submit booking
10. **Success Toast** → Should show booking reference

Then:
11. **Admin Login** → Go to `/admin/login`
12. **Kanban Board** → See your booking in "Pending Review"
13. **Drag Card** → Move to different status
14. **Click Card** → View booking details

---

## 🐛 Common Issues & Solutions

### "Bucket not found" error
**Solution:** Create storage buckets using `storage-buckets-setup.sql` or manual steps above

### "Row Level Security" error
**Solution:** RLS policies are in `database-setup.sql` - make sure you ran the full script

### Images not uploading
**Solution:** 
1. Check buckets are PUBLIC
2. Check file size < 5MB
3. Check file format (jpg, png, webp)

### Admin can't login
**Solution:** Run this in SQL Editor:
```sql
SELECT * FROM admins WHERE username = 'admin';
```
If no results, the default admin wasn't created. Re-run `database-setup.sql`

### Bookings not showing in Kanban
**Solution:** Check browser console for errors. Verify RLS policies are set.

---

## 📞 Support Files

- `database-setup.sql` - Complete database schema
- `database-update.sql` - Schema updates for new features
- `storage-buckets-setup.sql` - Storage buckets creation
- `STORAGE-SETUP.md` - Detailed storage guide

---

## 🎨 Features

✅ Modern calendar-based booking
✅ Drag-and-drop Kanban board
✅ Image upload for cars and drivers
✅ Toast notifications
✅ Trip type selection (within/outside city)
✅ Flexible duration (6, 12, 24 hours)
✅ Optional driver selection
✅ Real-time price calculation
✅ GHL integration (non-blocking)
✅ Responsive design
✅ Admin authentication

---

## 🔒 Security Notes

- All admin routes are protected
- Row Level Security enabled on all tables
- Storage buckets use authenticated upload policies
- Public read access for images only
- Default admin password should be changed immediately

---

**Need help?** Check the error in browser console (F12) and refer to the troubleshooting section above.
