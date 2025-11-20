# 🚗 Car Booking System

A complete car rental booking system with admin CRM dashboard.

## ⚠️ NO SAMPLE DATA

This project contains **NO dummy data or placeholders**. All cars, drivers, and bookings must be added manually through the admin dashboard.

## 🚀 Quick Start

### 1. Database Setup
```bash
# Go to Supabase SQL Editor at:
# https://uslaqreqkxruomeyxnei.supabase.co
# Run the database-setup.sql file
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development
```bash
npm run dev
```

### 4. Access the System
- **Customer Portal**: http://localhost:5173
- **Admin Login**: http://localhost:5173/admin/login
  - Username: `admin`
  - Password: `admin`
  - ⚠️ **CHANGE PASSWORD IMMEDIATELY!**

## 📦 What's Included

### Customer Features
- Modern booking interface
- 5-step booking process
- Real-time car availability
- Optional driver selection
- Price calculator (₱ PHP)

### Admin Features
- **Kanban Dashboard** - Manage bookings by status
- **Cars Management** - Add/edit/delete vehicles
- **Drivers Management** - Manage drivers
- **Analytics** - Revenue tracking in ₱

### Integrations
- Supabase (Database)
- GHL API (Contact sync)

## 🗄️ Database Tables

- `admin_users` - Admin authentication (1 user created)
- `cars` - **EMPTY** - Add via admin dashboard
- `drivers` - **EMPTY** - Add via admin dashboard
- `bookings` - **EMPTY**
- `availability_blocks` - **EMPTY**

## 🔑 Credentials

**Supabase:**
- URL: https://uslaqreqkxruomeyxnei.supabase.co
- Configured in `.env`

**GHL API:**
- Configured in `.env`
- Sends: name, email, phone, address, appointment, status tag

**Admin:**
- Username: `admin`
- Password: `admin`

## 📝 Next Steps

1. Run `database-setup.sql` in Supabase
2. Login to admin dashboard
3. Add your cars in Cars Management
4. Add your drivers in Drivers Management
5. Test booking flow
6. Deploy to production

## 🛠️ Tech Stack

- React 18 + Vite
- TailwindCSS
- Supabase
- GHL API v2

## 📄 License

MIT
