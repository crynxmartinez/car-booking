# 🚀 Vercel Environment Variables Setup

Complete list of environment variables to add to Vercel for PayMongo integration.

---

## 📋 How to Add Variables

1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Select your project: **car-booking**
3. Go to **Settings** → **Environment Variables**
4. Add each variable below
5. Select **Production**, **Preview**, and **Development** for each
6. Click **Save**
7. **Redeploy** your application

---

## ✅ Required Environment Variables

### 1. Supabase (Already Set ✅)

| Variable Name | Value |
|--------------|-------|
| `VITE_SUPABASE_URL` | Your Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

### 2. GoHighLevel (Already Set ✅)

| Variable Name | Value |
|--------------|-------|
| `VITE_GHL_API_KEY` | Your GHL API key |
| `VITE_GHL_LOCATION_ID` | Your GHL location ID |

### 3. PayMongo (NEW - Add These! 🆕)

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_PAYMONGO_SECRET_KEY` | Your PayMongo secret key | Production, Preview, Development |
| `VITE_PAYMONGO_PUBLIC_KEY` | Your PayMongo public key | Production, Preview, Development |
| `VITE_PAYMONGO_ENV` | `test` | Production, Preview, Development |
| `VITE_APP_URL` | `https://car-booking-gules.vercel.app` | Production, Preview, Development |

---

## 📝 Copy-Paste Format for Vercel

### PayMongo Secret Key
```
Name: VITE_PAYMONGO_SECRET_KEY
Value: [Your PayMongo secret key from dashboard]
Environment: Production, Preview, Development
```

### PayMongo Public Key
```
Name: VITE_PAYMONGO_PUBLIC_KEY
Value: [Your PayMongo public key from dashboard]
Environment: Production, Preview, Development
```

### PayMongo Environment
```
Name: VITE_PAYMONGO_ENV
Value: test
Environment: Production, Preview, Development
```

### App URL
```
Name: VITE_APP_URL
Value: https://car-booking-gules.vercel.app
Environment: Production, Preview, Development
```

---

## 🔄 After Adding Variables

1. **Redeploy** your application:
   - Go to **Deployments** tab
   - Click on the latest deployment
   - Click **Redeploy**
   
   OR
   
   - Push a new commit to trigger automatic deployment

2. **Wait for deployment** to complete (usually 1-2 minutes)

3. **Test the payment flow:**
   - Go to https://car-booking-gules.vercel.app
   - Make a booking
   - Verify redirect to GCash payment page

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Environment variables are set in Vercel
- [ ] Deployment completed successfully
- [ ] Booking form loads correctly
- [ ] Deposit amount shows in booking summary
- [ ] Payment redirect works (redirects to GCash)
- [ ] Webhook endpoint is accessible: https://car-booking-gules.vercel.app/api/paymongo-webhook
- [ ] PayMongo webhook is configured and enabled

---

## 🔐 Security Notes

### Test vs Production Keys

**Currently using TEST keys:**
- `sk_test_xxx` - Test secret key
- `pk_test_xxx` - Test public key
- No real money involved
- Safe for testing

**For Production (when ready):**
1. Complete PayMongo business verification
2. Get production keys from PayMongo dashboard
3. Replace `sk_test_xxx` with `sk_live_xxx`
4. Replace `pk_test_xxx` with `pk_live_xxx`
5. Change `VITE_PAYMONGO_ENV` from `test` to `live`
6. Update webhook URL if needed

---

## 🐛 Troubleshooting

### "Payment gateway not configured" error
**Solution:** Check that `VITE_PAYMONGO_SECRET_KEY` is set in Vercel

### Webhook not receiving events
**Solution:** 
1. Verify webhook URL in PayMongo dashboard
2. Check Vercel function logs
3. Ensure webhook is enabled

### Payment redirect not working
**Solution:**
1. Check `VITE_APP_URL` is correct
2. Verify API endpoint is deployed
3. Check browser console for errors

---

## 📞 Support

- **PayMongo Dashboard:** https://dashboard.paymongo.com
- **PayMongo Docs:** https://developers.paymongo.com
- **Vercel Dashboard:** https://vercel.com/dashboard

---

**Setup Complete! 🎉**

Once you add these variables and redeploy, your GCash payment system will be fully functional!
