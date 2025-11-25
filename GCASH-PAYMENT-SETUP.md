# GCash Payment Integration Setup Guide

Complete guide for setting up GCash payment integration using Checkout.com API.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Checkout.com Account Setup](#checkoutcom-account-setup)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Vercel Deployment](#vercel-deployment)
6. [Webhook Configuration](#webhook-configuration)
7. [Testing](#testing)
8. [Production Checklist](#production-checklist)

---

## Prerequisites

- ✅ Checkout.com account (sandbox for testing, production for live)
- ✅ Vercel account for serverless functions
- ✅ Supabase database already set up
- ✅ GCash account for testing payments

---

## Checkout.com Account Setup

### 1. Sign Up for Checkout.com

1. Go to [https://www.checkout.com/](https://www.checkout.com/)
2. Click "Get Started" or "Sign Up"
3. Fill in your business details
4. Verify your email address

### 2. Get API Keys

#### Sandbox (Testing):
1. Login to Checkout.com Dashboard
2. Navigate to **Settings** → **Channels**
3. Create a new channel or select existing
4. Copy the following:
   - **Secret Key** (starts with `sk_test_`)
   - **Public Key** (starts with `pk_test_`)
   - **Processing Channel ID** (starts with `pc_`)

#### Production (Live):
1. Complete business verification in Checkout.com
2. Switch to Production mode in dashboard
3. Get production keys (starts with `sk_` and `pk_`)

### 3. Enable GCash Payment Method

1. In Checkout.com Dashboard
2. Go to **Settings** → **Payment Methods**
3. Enable **GCash** for your region (Philippines)
4. Configure GCash settings if required

---

## Environment Variables

### Local Development (.env)

Create or update `.env` file:

```env
# Existing Supabase variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Existing GHL variables
VITE_GHL_API_KEY=your_ghl_api_key
VITE_GHL_LOCATION_ID=your_ghl_location_id

# NEW: Checkout.com Configuration
VITE_CHECKOUT_SECRET_KEY=your_checkout_secret_key
VITE_CHECKOUT_PUBLIC_KEY=your_checkout_public_key
VITE_CHECKOUT_PROCESSING_CHANNEL_ID=your_processing_channel_id
VITE_CHECKOUT_ENV=sandbox

# NEW: Application URL (for payment redirects)
VITE_APP_URL=http://localhost:5173
```

### Vercel Production

Add these environment variables in Vercel:

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_CHECKOUT_SECRET_KEY` | Your secret key from Checkout.com | Production, Preview, Development |
| `VITE_CHECKOUT_PUBLIC_KEY` | Your public key from Checkout.com | Production, Preview, Development |
| `VITE_CHECKOUT_PROCESSING_CHANNEL_ID` | Your processing channel ID | Production, Preview, Development |
| `VITE_CHECKOUT_ENV` | `sandbox` or `production` | Production, Preview, Development |
| `VITE_APP_URL` | `https://your-domain.vercel.app` | Production, Preview, Development |

**Important:** Use `sandbox` for testing, `production` for live payments.

---

## Database Setup

### 1. Run SQL Scripts

The following SQL scripts have already been executed:

#### Payment Columns (Already Done ✅)
```sql
-- Adds payment tracking columns to bookings table
ALTER TABLE bookings 
ADD COLUMN payment_status TEXT DEFAULT 'pending',
ADD COLUMN payment_id TEXT,
ADD COLUMN payment_amount DECIMAL(10,2) DEFAULT 20.00,
ADD COLUMN payment_date TIMESTAMP,
ADD COLUMN payment_method TEXT DEFAULT 'gcash';
```

#### Settings Table (Already Done ✅)
```sql
-- Creates settings table for configurable deposit amount
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Default settings
INSERT INTO settings (key, value, description) VALUES
  ('deposit_amount', '20', 'Booking deposit amount in PHP'),
  ('deposit_enabled', 'true', 'Enable/disable deposit requirement'),
  ('booking_expiry_hours', '24', 'Hours until unpaid booking expires'),
  ('allow_cash_payment', 'true', 'Allow cash payment on pickup');
```

### 2. Verify Database

Run this query in Supabase SQL Editor to verify:

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND column_name IN ('payment_status', 'payment_id', 'payment_amount', 'payment_date');

-- Check settings
SELECT * FROM settings ORDER BY key;
```

---

## Vercel Deployment

### 1. Deploy to Vercel

```bash
# If not already deployed
vercel

# Or redeploy
vercel --prod
```

### 2. Verify API Endpoints

After deployment, these endpoints should be available:

- `https://your-domain.vercel.app/api/create-payment`
- `https://your-domain.vercel.app/api/webhook`

Test the endpoints:

```bash
# Test create-payment endpoint
curl -X POST https://your-domain.vercel.app/api/create-payment \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "test-123",
    "amount": 20,
    "reference": "BK-TEST-001",
    "customer": {
      "name": "Test User",
      "email": "test@example.com"
    }
  }'
```

---

## Webhook Configuration

### 1. Get Webhook URL

Your webhook URL will be:
```
https://your-domain.vercel.app/api/webhook
```

### 2. Configure in Checkout.com

1. Login to Checkout.com Dashboard
2. Go to **Settings** → **Webhooks**
3. Click **Add Webhook**
4. Enter webhook URL: `https://your-domain.vercel.app/api/webhook`
5. Select events to listen for:
   - ✅ `payment_approved`
   - ✅ `payment_captured`
   - ✅ `payment_declined`
   - ✅ `payment_canceled`
   - ✅ `payment_expired`
6. Save webhook

### 3. Test Webhook

Checkout.com provides a webhook testing tool:
1. Go to **Settings** → **Webhooks**
2. Click on your webhook
3. Click **Test** button
4. Send test events

---

## Testing

### 1. Test in Sandbox Mode

#### Test Payment Flow:

1. **Make a booking** on your site
2. **Enter test details**:
   - Name: Test User
   - Email: test@example.com
   - Phone: +63 912 345 6789
3. **Click "Confirm Booking"**
4. **You'll be redirected** to GCash payment page
5. **Use test credentials** (provided by Checkout.com)
6. **Complete payment**
7. **Verify redirect** to success page

#### Check Database:

```sql
-- Check booking was created with payment status
SELECT 
  booking_reference,
  customer_name,
  payment_status,
  payment_id,
  payment_amount,
  payment_date
FROM bookings
ORDER BY created_at DESC
LIMIT 5;
```

#### Check Admin Dashboard:

1. Login to admin panel
2. Go to **Dashboard** (Kanban board)
3. Verify booking shows payment status badge
4. Go to **Settings**
5. Try changing deposit amount
6. Make another booking to verify new amount

### 2. Test Scenarios

| Scenario | Expected Result |
|----------|----------------|
| Successful payment | Status: `paid`, redirect to success page |
| Failed payment | Status: `failed`, redirect to failure page |
| Cancelled payment | Status: `pending`, redirect to failure page |
| Retry payment | New payment ID created, redirect to GCash |
| Webhook received | Booking status updated automatically |

---

## Production Checklist

Before going live:

### 1. Checkout.com

- [ ] Complete business verification
- [ ] Switch to production mode
- [ ] Get production API keys
- [ ] Update environment variables with production keys
- [ ] Set `VITE_CHECKOUT_ENV=production`
- [ ] Configure production webhook URL

### 2. Environment Variables

- [ ] Update all `VITE_CHECKOUT_*` variables in Vercel
- [ ] Set `VITE_APP_URL` to production domain
- [ ] Remove or secure test credentials

### 3. Testing

- [ ] Test complete booking flow in production
- [ ] Test payment success scenario
- [ ] Test payment failure scenario
- [ ] Test webhook delivery
- [ ] Test admin settings page
- [ ] Test deposit amount changes

### 4. Security

- [ ] Implement webhook signature verification
- [ ] Enable HTTPS only
- [ ] Review API key permissions
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Configure rate limiting if needed

### 5. User Experience

- [ ] Test on mobile devices
- [ ] Test on different browsers
- [ ] Verify email notifications (if implemented)
- [ ] Check WhatsApp integration still works
- [ ] Verify GHL integration still works

---

## Payment Flow Diagram

```
┌─────────────┐
│   Customer  │
│ Fills Form  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Confirm Booking │
└──────┬──────────┘
       │
       ▼
┌──────────────────┐
│ Save to Database │
│ Status: pending  │
└──────┬───────────┘
       │
       ▼
┌────────────────────┐
│ Create Payment API │
│ /api/create-payment│
└──────┬─────────────┘
       │
       ▼
┌──────────────────┐
│ Checkout.com API │
│ Returns redirect │
└──────┬───────────┘
       │
       ▼
┌─────────────────┐
│ Redirect to     │
│ GCash Payment   │
└──────┬──────────┘
       │
       ├─── Success ──────┐
       │                  │
       │                  ▼
       │          ┌───────────────┐
       │          │ Success Page  │
       │          │ Show WhatsApp │
       │          └───────────────┘
       │
       └─── Failure ──────┐
                          │
                          ▼
                  ┌───────────────┐
                  │ Failure Page  │
                  │ Retry Option  │
                  └───────────────┘

┌──────────────────┐
│ Checkout.com     │
│ Sends Webhook    │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ /api/webhook     │
│ Updates Database │
│ Status: paid     │
└──────────────────┘
```

---

## Troubleshooting

### Payment Creation Fails

**Error:** `Payment gateway not configured`
- **Solution:** Check environment variables are set correctly in Vercel

**Error:** `401 Unauthorized`
- **Solution:** Verify API keys are correct and not expired

**Error:** `No redirect URL received`
- **Solution:** Check processing channel ID is correct

### Webhook Not Received

- **Check:** Webhook URL is correct in Checkout.com
- **Check:** Webhook events are enabled
- **Check:** Firewall/security settings allow Checkout.com IPs
- **Test:** Use Checkout.com webhook testing tool

### Payment Status Not Updating

- **Check:** Webhook is configured correctly
- **Check:** Database has correct payment_id
- **Check:** Supabase RLS policies allow updates
- **Check:** Webhook logs in Vercel for errors

---

## Support

### Checkout.com Support
- Documentation: https://www.checkout.com/docs
- Support: support@checkout.com
- Dashboard: https://dashboard.checkout.com

### Internal Support
- Check Vercel logs for API errors
- Check Supabase logs for database errors
- Check browser console for frontend errors

---

## Next Steps

After successful setup:

1. **Monitor payments** in Checkout.com dashboard
2. **Set up email notifications** for payment confirmations
3. **Implement auto-cancel** for expired bookings
4. **Add payment receipts** feature
5. **Set up refund workflow** if needed

---

**Setup Complete! 🎉**

Your GCash payment integration is now ready to accept deposits for car bookings.
