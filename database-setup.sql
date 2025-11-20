-- Car Booking System Database Setup
-- NO SAMPLE DATA - All data will be added manually through admin dashboard
-- Run these commands in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'manager', 'staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Insert ONLY the default admin user (username: admin, password: admin)
-- IMPORTANT: Change this password immediately after first login!
INSERT INTO admin_users (username, password_hash, role) 
VALUES ('admin', 'admin', 'super_admin')
ON CONFLICT (username) DO NOTHING;

-- 2. Cars Table
CREATE TABLE IF NOT EXISTS cars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    color TEXT NOT NULL,
    license_plate TEXT NOT NULL UNIQUE,
    seats INTEGER NOT NULL DEFAULT 4,
    luggage_capacity INTEGER NOT NULL DEFAULT 2,
    features JSONB DEFAULT '{"ac": true, "gps": false, "bluetooth": true, "fuel_type": "petrol"}'::jsonb,
    city_only BOOLEAN DEFAULT false,
    price_6hrs DECIMAL(10,2) NOT NULL,
    price_12hrs DECIMAL(10,2) NOT NULL,
    price_24hrs DECIMAL(10,2) NOT NULL,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Drivers Table
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    photo_url TEXT,
    phone_number TEXT NOT NULL,
    license_number TEXT NOT NULL UNIQUE,
    years_experience INTEGER NOT NULL DEFAULT 0,
    languages TEXT[] DEFAULT ARRAY['English', 'Filipino']::TEXT[],
    price_6hrs DECIMAL(10,2) NOT NULL,
    price_12hrs DECIMAL(10,2) NOT NULL,
    price_24hrs DECIMAL(10,2) NOT NULL,
    rating DECIMAL(3,2) DEFAULT 5.0 CHECK (rating >= 1 AND rating <= 5),
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'on_duty', 'off_duty')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference TEXT UNIQUE NOT NULL,
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE RESTRICT,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    pickup_location TEXT NOT NULL,
    dropoff_location TEXT NOT NULL,
    pickup_date DATE NOT NULL,
    pickup_time TIME NOT NULL,
    rental_duration TEXT NOT NULL CHECK (rental_duration IN ('6hrs', '12hrs', '24hrs')),
    is_outside_city BOOLEAN DEFAULT false,
    needs_driver BOOLEAN DEFAULT false,
    car_price DECIMAL(10,2) NOT NULL,
    driver_price DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    special_requests TEXT,
    status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    ghl_contact_id TEXT,
    terms_accepted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT
);

-- 5. Availability Blocks Table (for maintenance, blocked dates, etc.)
CREATE TABLE IF NOT EXISTS availability_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    blocked_from TIMESTAMP WITH TIME ZONE NOT NULL,
    blocked_to TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_date ON bookings(pickup_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_car_id ON bookings(car_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_availability_blocks_car_id ON availability_blocks(car_id);

-- Enable Row Level Security (RLS)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow all for now - customize based on your needs)
CREATE POLICY "Allow all operations on admin_users" ON admin_users FOR ALL USING (true);
CREATE POLICY "Allow all operations on cars" ON cars FOR ALL USING (true);
CREATE POLICY "Allow all operations on drivers" ON drivers FOR ALL USING (true);
CREATE POLICY "Allow all operations on bookings" ON bookings FOR ALL USING (true);
CREATE POLICY "Allow all operations on availability_blocks" ON availability_blocks FOR ALL USING (true);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - admin_users (1 admin user created)';
    RAISE NOTICE '  - cars (EMPTY - add via admin dashboard)';
    RAISE NOTICE '  - drivers (EMPTY - add via admin dashboard)';
    RAISE NOTICE '  - bookings (EMPTY)';
    RAISE NOTICE '  - availability_blocks (EMPTY)';
    RAISE NOTICE '';
    RAISE NOTICE 'Default admin credentials:';
    RAISE NOTICE '  Username: admin';
    RAISE NOTICE '  Password: admin';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  CHANGE PASSWORD IMMEDIATELY AFTER FIRST LOGIN!';
    RAISE NOTICE '========================================';
END $$;
