# GoHighLevel (GHL) Integration Setup

## Overview
The car booking system automatically syncs all bookings to GoHighLevel CRM. When a user books, a contact is created in GHL with all booking details. When you move bookings through the Kanban stages, the contact tags are automatically updated.

## Environment Variables

### Local Development (.env file)
Create a `.env` file in the project root with:

```env
VITE_SUPABASE_URL=https://uslaqreqkxruomeyxnei.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GHL_API_KEY=pit-23e4f000-c505-4c34-9ea2-2caf15e4fd42
VITE_GHL_LOCATION_ID=xzA6eU8kOYmBuwFdr3CF
```

### Production (Vercel)
Add these environment variables in Vercel:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `VITE_GHL_API_KEY` = `pit-23e4f000-c505-4c34-9ea2-2caf15e4fd42`
   - `VITE_GHL_LOCATION_ID` = `xzA6eU8kOYmBuwFdr3CF`

## GHL Custom Fields Setup

Before the integration works properly, you need to create these custom fields in GHL:

1. Go to GHL → Settings → Custom Fields
2. Create the following custom fields:

| Field Name | Field Key | Type | Description |
|------------|-----------|------|-------------|
| Car | `car` | Text | Name of the car booked |
| Booking Date & Time | `booking_date_and_time` | Text | Full date and time of pickup |
| Booking Time | `booking_time` | Text | Pickup time |
| Driver | `driver` | Text | Driver name or "No Driver" |
| Price | `price` | Text | Total booking price |
| Booking Reference | `booking_reference` | Text | Unique booking reference number |
| Patient Phone Number | `patient_phone_number` | Text | Customer phone number (for WhatsApp) |

## How It Works

### 1. New Booking (Frontend)
When a user completes a booking:
- Contact is created/updated in GHL with:
  - Name, Email, Phone
  - Custom fields: car, booking_date_and_time, booking_time, driver, price, booking_reference, patient_phone_number
  - Tag: `pending review - car`
- User receives success message with WhatsApp instructions
- WhatsApp automatically opens with pre-filled message "car"

### 2. Status Changes (Kanban)
When you drag a booking card to a different column:
- Contact tag is updated in GHL to match the new status

### 3. Available Tags
Each tag follows the format: `[status] - car`

- `pending review - car` - New bookings awaiting review
- `approved - car` - Booking approved by admin
- `confirmed - car` - Customer confirmed the booking
- `in progress - car` - Rental is currently active
- `completed - car` - Rental completed successfully
- `cancelled - car` - Booking was cancelled

## GHL Automation Examples

You can create automations in GHL based on these tags:

### Example 1: Welcome Email
**Trigger:** Contact tagged with `pending review - car`
**Action:** Send email with booking confirmation and payment instructions

### Example 2: Confirmation Reminder
**Trigger:** Contact tagged with `approved - car`
**Action:** Send SMS reminder to confirm booking

### Example 3: Pickup Reminder
**Trigger:** Contact tagged with `confirmed - car` + booking date is tomorrow
**Action:** Send SMS with pickup details and office address

### Example 4: Thank You Message
**Trigger:** Contact tagged with `completed - car`
**Action:** Send thank you email and request review

### Example 5: Cancellation Follow-up
**Trigger:** Contact tagged with `cancelled - car`
**Action:** Send email asking for feedback

## Custom Field Usage in GHL

You can use these custom fields in your emails, SMS, and workflows:

```
Hi {{contact.first_name}},

Your booking is confirmed!

Car: {{contact.car}}
Date & Time: {{contact.booking_date_and_time}}
Driver: {{contact.driver}}
Total Price: {{contact.price}}
Reference: {{contact.booking_reference}}

See you soon!
```

## Testing

1. Make a test booking on the website
2. Check GHL → Contacts to see if the contact was created
3. Verify all custom fields are populated
4. Move the booking in Kanban and check if tags update in GHL

## Troubleshooting

### Contact not created in GHL
- Check browser console for errors
- Verify API key and Location ID are correct
- Ensure custom fields are created in GHL with exact field keys

### Tags not updating
- Check if `ghl_contact_id` is stored in the booking record
- Verify the contact exists in GHL
- Check browser console for API errors

### Custom fields not showing
- Ensure field keys match exactly (case-sensitive)
- Create the custom fields in GHL before testing

## Non-Blocking Integration

The GHL integration is **non-blocking**, meaning:
- ✅ Bookings will succeed even if GHL fails
- ✅ Users won't see errors if GHL is down
- ⚠️ Errors are logged to console for debugging
- 📝 You can check console logs to see GHL sync status
