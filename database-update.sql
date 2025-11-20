-- Add new columns to bookings table for the updated booking flow
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS trip_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS duration_hours INTEGER;

-- Update existing bookings to have default values
UPDATE bookings 
SET trip_type = 'within_city', 
    duration_hours = 24 
WHERE trip_type IS NULL;

-- Add comments for clarity
COMMENT ON COLUMN bookings.trip_type IS 'Type of trip: within_city or outside_city';
COMMENT ON COLUMN bookings.duration_hours IS 'Duration of rental in hours: 6, 12, or 24';
