# Khalti Payment Integration Setup

This guide explains how to set up Khalti payment integration for the BookZone application.

## 🚀 Features

- **Khalti Digital Wallet** - Primary payment method
- **Multiple Payment Options** - eBanking, Mobile Banking, Connect IPS, SCT
- **Cash on Delivery** - Alternative payment method
- **Secure Payment Gateway** - Powered by Khalti's secure infrastructure
- **Order Management** - Complete order tracking and status updates

## 📋 Prerequisites

1. **Khalti Merchant Account**
   - Sign up at [Khalti Merchant Portal](https://merchant.khalti.com/)
   - Complete KYC verification
   - Get your public and secret keys

2. **Environment Setup**
   - Node.js 18+ 
   - Next.js 14+
   - Django backend running

## ⚙️ Configuration

### 1. Environment Variables

Create a `.env.local` file in the `client` directory:

```bash
# Khalti Payment Configuration
NEXT_PUBLIC_KHALTI_PUBLIC_KEY=your_khalti_public_key_here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Khalti Keys

Replace the test key with your actual Khalti public key:

```javascript
// In client/lib/khalti.ts
PUBLIC_KEY: process.env.NEXT_PUBLIC_KHALTI_PUBLIC_KEY || 'your_actual_public_key'
```

## 🔧 Backend Requirements

The Django backend should support the following order fields:

```python
# Additional fields for orders
shipping_address = models.TextField()
customer_name = models.CharField(max_length=200)
customer_email = models.EmailField()
customer_phone = models.CharField(max_length=20)
payment_status = models.CharField(max_length=20, default='pending')
```

## 🎯 Payment Flow

### 1. Cart to Checkout
- User adds items to cart
- Proceeds to checkout page
- Fills shipping information
- Selects payment method

### 2. Khalti Payment
- User clicks "Pay with Khalti"
- Order is created with 'pending' status
- Khalti checkout modal opens
- User completes payment on Khalti's secure gateway
- Payment success callback updates order status to 'paid'

### 3. Cash on Delivery
- User selects "Cash on Delivery"
- Order is created with 'pending' status
- User pays when order is delivered

## 🔒 Security Features

- **HTTPS Required** - Khalti only works on secure connections
- **Server-side Validation** - All payment confirmations verified on backend
- **Order Status Tracking** - Complete audit trail of payment status
- **Error Handling** - Graceful handling of payment failures

## 🧪 Testing

### Test Mode
Use Khalti's test credentials for development:

```javascript
// Test public key
PUBLIC_KEY: 'test_public_key_dc74e0fd57cb46cd93832aee0a390234'
```

### Test Payment Methods
- **Khalti Wallet** - Use test wallet credentials
- **eBanking** - Use test bank credentials
- **Mobile Banking** - Use test mobile banking credentials

## 📱 Supported Payment Methods

1. **Khalti Digital Wallet**
   - Instant payment
   - No additional fees
   - Most popular in Nepal

2. **eBanking**
   - Direct bank transfer
   - Real-time processing
   - Supported by major Nepali banks

3. **Mobile Banking**
   - Mobile banking apps
   - Quick and convenient
   - Wide bank coverage

4. **Connect IPS**
   - Inter-bank payment system
   - Real-time settlement
   - Government-backed

5. **SCT (System for Cash Transfer)**
   - Nepal Rastra Bank system
   - Instant settlement
   - High security

## 🚨 Error Handling

The integration handles various error scenarios:

- **Payment Failed** - User is notified and can retry
- **Network Issues** - Graceful fallback with user feedback
- **Invalid Amount** - Validation prevents invalid payments
- **Order Creation Failed** - Payment is not processed

## 📊 Order Status Flow

```
Pending → Paid → Processing → Shipped → Delivered
   ↓
Cancelled (if payment fails or order cancelled)
```

## 🔧 Customization

### Payment Preferences
Modify payment methods in `client/lib/khalti.ts`:

```javascript
PAYMENT_PREFERENCES: ['KHALTI', 'EBANKING', 'MOBILE_BANKING', 'CONNECT_IPS', 'SCT']
```

### Styling
Customize the checkout page styling in `client/app/checkout/page.tsx`

### Order Status
Add custom order statuses in the backend and update the frontend accordingly

## 📞 Support

For Khalti integration issues:
- **Khalti Documentation**: [https://docs.khalti.com/](https://docs.khalti.com/)
- **Khalti Support**: support@khalti.com
- **Merchant Portal**: [https://merchant.khalti.com/](https://merchant.khalti.com/)

## 🔄 Updates

Keep the Khalti script updated by checking their latest version:
- Current: `2020.12.17.0.0.0`
- Check: [Khalti CDN](https://khalti.s3.ap-south-1.amazonaws.com/KPG/dist/)

## ✅ Production Checklist

- [ ] Replace test keys with production keys
- [ ] Enable HTTPS on production server
- [ ] Test all payment methods
- [ ] Verify webhook endpoints
- [ ] Set up error monitoring
- [ ] Configure order status notifications
- [ ] Test payment failure scenarios
- [ ] Verify order status updates
- [ ] Test cart clearing after payment
- [ ] Validate shipping information handling
