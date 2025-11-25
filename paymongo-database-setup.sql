-- ============================================
-- PayMongo GCash Payment Integration
-- Database Setup Script
-- ============================================

-- Add payment-related columns to bookings table
-- (These were already added in the previous setup)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2) DEFAULT 20.00,
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'gcash';

-- Add comments to explain payment columns
COMMENT ON COLUMN bookings.payment_status IS 'Payment status: pending (awaiting payment), paid (payment confirmed), failed (payment failed), refunded (payment refunded)';
COMMENT ON COLUMN bookings.payment_id IS 'PayMongo source/payment ID (e.g., src_xxx or pay_xxx)';
COMMENT ON COLUMN bookings.payment_amount IS 'Deposit amount in PHP (default: 20.00)';
COMMENT ON COLUMN bookings.payment_date IS 'Timestamp when payment was confirmed';
COMMENT ON COLUMN bookings.payment_method IS 'Payment method used (gcash, cash, etc.)';

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_id ON bookings(payment_id);

-- Update existing bookings to have 'paid' status (since they were created before payment system)
UPDATE bookings 
SET payment_status = 'paid', 
    payment_date = created_at 
WHERE payment_status IS NULL OR payment_status = 'pending';

-- ============================================
-- Settings Table (Already exists)
-- ============================================

-- Create settings table for configurable values
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by TEXT
);

-- Add RLS policies for settings (if not already exists)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read settings
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'settings' 
    AND policyname = 'Anyone can read settings'
  ) THEN
    CREATE POLICY "Anyone can read settings"
      ON settings FOR SELECT
      TO authenticated, anon
      USING (true);
  END IF;
END $$;

-- Only authenticated users can update settings (admins)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'settings' 
    AND policyname = 'Authenticated users can update settings'
  ) THEN
    CREATE POLICY "Authenticated users can update settings"
      ON settings FOR UPDATE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
  ('deposit_amount', '20', 'Booking deposit amount in PHP'),
  ('deposit_enabled', 'true', 'Enable/disable deposit requirement'),
  ('booking_expiry_hours', '24', 'Hours until unpaid booking expires'),
  ('allow_cash_payment', 'true', 'Allow cash payment on pickup')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- Verification Queries
-- ============================================

-- Check if payment columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND column_name IN ('payment_status', 'payment_id', 'payment_amount', 'payment_date', 'payment_method')
ORDER BY column_name;

-- Check settings
SELECT * FROM settings ORDER BY key;

-- Check bookings with payment info
SELECT 
  booking_reference,
  customer_name,
  payment_status,
  payment_amount,
  payment_method,
  payment_date,
  created_at
FROM bookings
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- Success Message
-- ============================================
SELECT 'PayMongo database setup complete! ✅' AS status;
