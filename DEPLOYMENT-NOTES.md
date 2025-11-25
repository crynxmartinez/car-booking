# 🚀 Deployment Notes

## Latest Deployment: PayMongo Integration

**Date:** November 26, 2025  
**Version:** PayMongo GCash Payment Gateway

### Changes:
- Migrated from Checkout.com to PayMongo
- Philippine-based payment gateway
- GCash payment support
- Webhook integration for real-time updates

### Environment Variables Required:
- `VITE_PAYMONGO_SECRET_KEY`
- `VITE_PAYMONGO_PUBLIC_KEY`
- `VITE_PAYMONGO_ENV`
- `VITE_APP_URL`

### Webhook URL:
```
https://car-booking-gules.vercel.app/api/paymongo-webhook
```

### API Endpoints:
- `/api/create-payment` - Create GCash payment source
- `/api/paymongo-webhook` - Handle payment events

---

**Status:** ✅ Ready for deployment
