# 💳 GCash Payment Integration - Feature Documentation

Complete documentation of the GCash payment integration features.

---

## 🎯 Overview

The car booking system now includes a complete GCash payment integration that requires customers to pay a configurable deposit before confirming their booking.

### Key Features:
- ✅ **Configurable Deposit Amount** - Admin can change deposit from ₱20 to any amount
- ✅ **GCash Payment Gateway** - Secure payment via Checkout.com
- ✅ **Payment Status Tracking** - Real-time payment status updates
- ✅ **Admin Settings Panel** - Easy deposit management
- ✅ **Payment Retry** - Customers can retry failed payments
- ✅ **Webhook Integration** - Automatic status updates
- ✅ **Payment Badges** - Visual payment status on Kanban board

---

## 📱 User Flow

### 1. Customer Books a Car

```
Customer fills booking form:
├── Select date & time
├── Choose trip type (within/outside city)
├── Select car
├── Choose driver (optional)
├── Select duration (6/12/24 hours)
└── Enter customer details
```

### 2. Booking Summary Shows Deposit

```
┌─────────────────────────────────┐
│ Booking Summary                 │
├─────────────────────────────────┤
│ Total Price:        ₱3,000.00   │
│ Deposit Required:      ₱20.00   │
│ Balance Due:        ₱2,980.00   │
│                                 │
│ 💳 You'll be redirected to      │
│    GCash to pay the deposit     │
└─────────────────────────────────┘
```

### 3. Payment Process

```
Click "Confirm Booking"
    ↓
Booking saved to database (status: pending)
    ↓
Redirect to GCash payment page
    ↓
Customer pays via GCash app
    ↓
┌─────────────┬─────────────┐
│   Success   │   Failure   │
└─────────────┴─────────────┘
      ↓              ↓
Success Page    Failure Page
WhatsApp Link   Retry Button
```

### 4. Payment Success

Customer sees:
- ✅ Payment confirmation
- 📱 WhatsApp button to get booking details
- 📧 Confirmation email (if configured)

### 5. Payment Failure

Customer can:
- 🔄 Retry payment
- 🏠 Return to home
- ❌ Cancel booking

---

## 🎛️ Admin Features

### 1. Settings Page

Access: **Admin Dashboard → Settings**

#### Deposit Amount Control

```
┌─────────────────────────────────┐
│ Deposit Amount                  │
├─────────────────────────────────┤
│ Amount (PHP): ₱ [____]          │
│                                 │
│ Quick Presets:                  │
│ [₱20] [₱50] [₱100] [₱200] [₱500]│
│                                 │
│ ☑ Require deposit for bookings  │
└─────────────────────────────────┘
```

**Use Cases:**
- Normal days: ₱20 deposit
- Weekends: ₱50 deposit
- Holidays: ₱100 deposit
- Peak season: ₱200 deposit

#### Booking Expiry

```
┌─────────────────────────────────┐
│ Booking Expiry                  │
├─────────────────────────────────┤
│ Auto-cancel after: [24] hours   │
│                                 │
│ Unpaid bookings will be         │
│ automatically cancelled         │
└─────────────────────────────────┘
```

#### Payment Options

```
┌─────────────────────────────────┐
│ Payment Options                 │
├─────────────────────────────────┤
│ ☑ Allow cash payment on pickup  │
│                                 │
│ If enabled, customers can pay   │
│ full amount in cash             │
└─────────────────────────────────┘
```

### 2. Kanban Board - Payment Status

Each booking card now shows payment status:

```
┌──────────────────────────┐
│ BK-ABC123    [✓ Paid]    │
├──────────────────────────┤
│ 👤 John Doe              │
│ 🚗 Honda Civic           │
│ 📅 Nov 26, 2025          │
│ ₱3,000.00                │
└──────────────────────────┘
```

**Status Badges:**
- 🟢 **✓ Paid** - Green badge (payment confirmed)
- 🟡 **⏳ Pending** - Yellow badge (awaiting payment)
- 🔴 **✗ Failed** - Red badge (payment failed)

### 3. Booking Details Modal

Shows complete payment information:
- Payment status
- Payment ID
- Deposit amount
- Payment date
- Payment method (GCash)

---

## 🔧 Technical Details

### Database Schema

#### Bookings Table (Updated)

```sql
bookings
├── id (uuid)
├── booking_reference (text)
├── customer_name (text)
├── customer_email (text)
├── customer_phone (text)
├── total_price (decimal)
├── status (text)
├── payment_status (text)      -- NEW: pending/paid/failed/refunded
├── payment_id (text)           -- NEW: Checkout.com payment ID
├── payment_amount (decimal)    -- NEW: Deposit amount
├── payment_date (timestamp)    -- NEW: When payment was confirmed
└── payment_method (text)       -- NEW: gcash/cash
```

#### Settings Table (New)

```sql
settings
├── id (uuid)
├── key (text)                  -- Setting identifier
├── value (text)                -- Setting value
├── description (text)          -- What this setting does
└── updated_at (timestamp)      -- Last update time
```

**Default Settings:**
- `deposit_amount`: "20"
- `deposit_enabled`: "true"
- `booking_expiry_hours`: "24"
- `allow_cash_payment`: "true"

### API Endpoints

#### 1. Create Payment
```
POST /api/create-payment

Request:
{
  "bookingId": "uuid",
  "amount": 20,
  "currency": "PHP",
  "reference": "BK-ABC123",
  "customer": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}

Response:
{
  "success": true,
  "paymentId": "pay_xxx",
  "redirectUrl": "https://gcash.com/pay/xxx"
}
```

#### 2. Webhook Handler
```
POST /api/webhook

Headers:
{
  "Cko-Signature": "signature_here"
}

Body:
{
  "type": "payment_approved",
  "data": {
    "id": "pay_xxx",
    "reference": "BK-ABC123",
    "approved_on": "2025-11-26T03:00:00Z"
  }
}
```

### Frontend Components

#### New Components:
1. **`src/pages/PaymentSuccess.jsx`** - Success page after payment
2. **`src/pages/PaymentFailure.jsx`** - Failure page with retry option
3. **`src/components/admin/Settings.jsx`** - Admin settings panel

#### Updated Components:
1. **`src/components/home/BookingFormNew.jsx`** - Payment integration
2. **`src/components/admin/KanbanBoard.jsx`** - Payment status badges
3. **`src/App.jsx`** - Payment page routes

#### New Libraries:
1. **`src/lib/checkout.js`** - Checkout.com API wrapper
2. **`src/lib/settings.js`** - Settings management

---

## 💰 Pricing Examples

### Scenario 1: Normal Booking
```
Car: Honda Civic (6 hours)     = ₱1,000
Driver: John Doe (6 hours)     = ₱500
Trip Type: Within City         = No surcharge
────────────────────────────────────────
Total:                         = ₱1,500
Deposit Required:              = ₱20
Balance Due (on pickup):       = ₱1,480
```

### Scenario 2: Outside City
```
Car: Toyota Camry (12 hours)   = ₱2,000
Driver: Jane Smith (12 hours)  = ₱800
Trip Type: Outside City        = +20% surcharge
────────────────────────────────────────
Subtotal:                      = ₱2,800
Surcharge (20%):               = ₱560
Total:                         = ₱3,360
Deposit Required:              = ₱50 (admin set higher)
Balance Due (on pickup):       = ₱3,310
```

### Scenario 3: Self-Drive
```
Car: Honda Civic (24 hours)    = ₱2,500
Driver: None                   = ₱0
Trip Type: Within City         = No surcharge
────────────────────────────────────────
Total:                         = ₱2,500
Deposit Required:              = ₱20
Balance Due (on pickup):       = ₱2,480
```

---

## 🔒 Security Features

### 1. Environment Variables
- API keys stored securely in Vercel
- Never exposed to frontend
- Separate sandbox/production keys

### 2. Webhook Verification
- Signature verification (to be implemented)
- IP whitelisting option
- HTTPS only

### 3. Payment Security
- PCI-DSS compliant (via Checkout.com)
- No card data stored
- Secure redirect to GCash

### 4. Database Security
- RLS policies on Supabase
- Encrypted connections
- Audit logging

---

## 📊 Admin Use Cases

### Use Case 1: Increase Deposit for Peak Season

**Scenario:** Christmas season, high demand

**Steps:**
1. Login to admin dashboard
2. Go to **Settings**
3. Change deposit from ₱20 to ₱100
4. Click **Save Changes**
5. All new bookings now require ₱100 deposit

**Result:** Higher commitment from customers, reduced no-shows

---

### Use Case 2: Temporarily Disable Deposits

**Scenario:** Promotion period, free deposit

**Steps:**
1. Go to **Settings**
2. Uncheck "Require deposit for all bookings"
3. Click **Save Changes**

**Result:** Customers can book without payment, pay full amount on pickup

---

### Use Case 3: Monitor Payment Status

**Scenario:** Check which bookings are paid

**Steps:**
1. Go to **Dashboard** (Kanban board)
2. Look for payment status badges
3. Filter by payment status (if implemented)

**Visual:**
```
Pending Review Column:
├── BK-001 [✓ Paid]      ← Confirmed
├── BK-002 [⏳ Pending]  ← Awaiting payment
└── BK-003 [✗ Failed]    ← Payment failed
```

---

## 🐛 Troubleshooting

### Customer Issues

#### "Payment page not loading"
**Cause:** Network issue or API error
**Solution:** 
- Check internet connection
- Try again in a few minutes
- Contact support if persists

#### "Payment successful but booking not confirmed"
**Cause:** Webhook delay
**Solution:**
- Wait 5-10 minutes
- Check email for confirmation
- Contact support with payment reference

#### "Can't retry payment"
**Cause:** Booking already cancelled
**Solution:**
- Create new booking
- Or contact support to reactivate

### Admin Issues

#### "Settings not saving"
**Cause:** Database connection issue
**Solution:**
- Check Supabase status
- Verify RLS policies
- Check browser console for errors

#### "Payment status not updating"
**Cause:** Webhook not configured
**Solution:**
- Check webhook URL in Checkout.com
- Verify webhook is enabled
- Check Vercel function logs

---

## 📈 Future Enhancements

### Planned Features:
1. **Email Notifications**
   - Payment confirmation emails
   - Payment reminder emails
   - Receipt generation

2. **Refund System**
   - Admin can issue refunds
   - Partial refund support
   - Refund tracking

3. **Payment Analytics**
   - Revenue dashboard
   - Payment success rate
   - Popular payment times

4. **Multiple Payment Methods**
   - Credit/Debit cards
   - PayMaya
   - Bank transfer

5. **Installment Payments**
   - Split payment option
   - Payment plans
   - Auto-debit

6. **Auto-Cancel Expired Bookings**
   - Scheduled job to cancel unpaid bookings
   - Notification before cancellation
   - Grace period option

---

## 📞 Support

### For Customers:
- **Email:** support@carbooking.com
- **Phone:** +63 947 934 0392
- **WhatsApp:** Chat "car" to get booking details

### For Admins:
- **Technical Issues:** Check Vercel logs
- **Payment Issues:** Check Checkout.com dashboard
- **Database Issues:** Check Supabase logs

---

## ✅ Feature Checklist

### Implemented Features:
- [x] GCash payment integration
- [x] Configurable deposit amount
- [x] Admin settings page
- [x] Payment status tracking
- [x] Payment success/failure pages
- [x] Webhook handler
- [x] Payment status badges
- [x] Retry payment option
- [x] Booking summary with deposit
- [x] Database schema updates

### Pending Implementation:
- [ ] Webhook signature verification
- [ ] Email notifications
- [ ] Auto-cancel expired bookings
- [ ] Refund system
- [ ] Payment analytics
- [ ] Receipt generation

---

**Payment Integration Complete! 🎉**

The system is now ready to accept GCash deposits for car bookings.
