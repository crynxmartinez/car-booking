# 🚀 Quick Start - GCash Payment Integration

Get the payment system running in 5 minutes!

---

## ⚡ Quick Setup (Development)

### 1. Get Checkout.com Sandbox Keys (2 minutes)

1. Sign up at [checkout.com](https://www.checkout.com)
2. Go to Dashboard → Settings → Channels
3. Copy these 3 values:
   - `Secret Key` (sk_test_xxx)
   - `Public Key` (pk_test_xxx)
   - `Processing Channel ID` (pc_xxx)

### 2. Update Environment Variables (1 minute)

Add to your `.env` file:

```env
VITE_CHECKOUT_SECRET_KEY=your_secret_key_from_checkout_dashboard
VITE_CHECKOUT_PUBLIC_KEY=your_public_key_from_checkout_dashboard
VITE_CHECKOUT_PROCESSING_CHANNEL_ID=your_channel_id_from_checkout_dashboard
VITE_CHECKOUT_ENV=sandbox
VITE_APP_URL=http://localhost:5173
```

### 3. Install Dependencies (if needed)

```bash
npm install @supabase/supabase-js
```

### 4. Run Development Server (1 minute)

```bash
npm run dev
```

### 5. Test the Flow (1 minute)

1. Open http://localhost:5173
2. Click "Book Now"
3. Fill in booking details
4. Click "Confirm Booking"
5. You'll be redirected to GCash payment page
6. Use test credentials to complete payment

---

## 🎯 Test Credentials

### Checkout.com Sandbox

When redirected to payment page, use:
- **Test Mode:** Automatically enabled in sandbox
- **Payment:** Follow on-screen instructions
- **Status:** Payment will be instantly approved in sandbox

---

## 🔍 Verify It's Working

### Check 1: Database
```sql
SELECT booking_reference, payment_status, payment_amount 
FROM bookings 
ORDER BY created_at DESC 
LIMIT 1;
```

Expected: `payment_status = 'paid'`

### Check 2: Admin Dashboard
1. Login to admin panel
2. Go to Dashboard
3. See payment status badge on booking card

### Check 3: Browser Console
Look for these logs:
```
💰 Deposit settings: { amount: 20, enabled: true }
💳 Initiating payment for ₱20
✅ Payment created: pay_xxx
```

---

## 🎛️ Change Deposit Amount

1. Login to admin panel
2. Go to **Settings**
3. Change amount to ₱50
4. Click **Save Changes**
5. Make a new booking
6. Verify deposit is now ₱50

---

## 🚨 Common Issues

### "Payment gateway not configured"
**Fix:** Check environment variables are set

### "Redirect URL not working"
**Fix:** Make sure `VITE_APP_URL` is correct

### "Webhook not updating status"
**Fix:** This is normal in local development. Status updates when you deploy to Vercel.

---

## 📦 Deploy to Production

### 1. Deploy to Vercel

```bash
vercel --prod
```

### 2. Add Environment Variables in Vercel

Go to Vercel → Settings → Environment Variables

Add all `VITE_CHECKOUT_*` variables

### 3. Configure Webhook

1. Go to Checkout.com Dashboard
2. Settings → Webhooks
3. Add webhook URL: `https://your-domain.vercel.app/api/webhook`
4. Select events: `payment_approved`, `payment_declined`, etc.

### 4. Test Production

1. Make a real booking
2. Pay with real GCash account
3. Verify webhook updates booking status

---

## ✅ You're Done!

Your payment system is now live! 🎉

**Next Steps:**
- Monitor payments in Checkout.com dashboard
- Adjust deposit amount as needed
- Set up email notifications (optional)

---

## 📚 Full Documentation

- [Complete Setup Guide](./GCASH-PAYMENT-SETUP.md)
- [Feature Documentation](./PAYMENT-FEATURES.md)
- [API Reference](./api/)

---

**Need Help?**

Check the troubleshooting section in [GCASH-PAYMENT-SETUP.md](./GCASH-PAYMENT-SETUP.md)
