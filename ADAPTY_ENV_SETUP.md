# Adapty Environment Variables Setup

## 🔑 Required Environment Variables

### **Frontend (.env)**
```bash
# Required: Adapty public SDK key for React Native SDK
EXPO_PUBLIC_ADAPTY_PUBLIC_SDK_KEY=public_live_your_public_key_here

# Or for testing with sandbox:
# EXPO_PUBLIC_ADAPTY_PUBLIC_SDK_KEY=public_test_your_sandbox_key_here
```

### **Backend (.env)**
```bash
# Required: Adapty secret token for server-to-server API calls
ADAPTY_SECRET_TOKEN=secret_live_your_secret_token_here

# Required: Webhook secret for signature verification
ADAPTY_WEBHOOK_SECRET=your_webhook_secret_here
```

## 📦 Optional Environment Variables (Recommended)

### **Backend Configuration (.env)**
```bash
# Product IDs (optional - defaults provided)
ADAPTY_PRO_PRODUCT_ID=lyra_pro_monthly
ADAPTY_PREMIUM_PRODUCT_ID=lyra_premium_monthly
ADAPTY_PRO_YEARLY_PRODUCT_ID=lyra_pro_yearly
ADAPTY_PREMIUM_YEARLY_PRODUCT_ID=lyra_premium_yearly

# Access Level IDs (optional - defaults provided)
ADAPTY_PRO_ACCESS_LEVEL_ID=pro
ADAPTY_PREMIUM_ACCESS_LEVEL_ID=premium

# Customer User ID configuration (optional - defaults to 'user_')
ADAPTY_CUSTOMER_USER_ID_PREFIX=user_
```

### **Frontend Configuration (.env)**
```bash
# Customer User ID configuration to match backend (optional)
EXPO_PUBLIC_ADAPTY_CUSTOMER_USER_ID_PREFIX=user_
```

## 🔍 How to Get Your Keys

### 1. Adapty Dashboard
1. Go to [Adapty Dashboard](https://app.adapty.io)
2. Select your app project
3. Go to **App settings** → **General**

### 2. Public SDK Key (Frontend)
- **Public Key**: Starts with `public_live_` or `public_test_`
- **Location**: App Settings → General → Public SDK key
- These are safe to use in client-side code

### 3. Secret Token (Backend)
- **Secret Token**: Starts with `secret_live_` or `secret_test_`
- **Location**: App Settings → General → Secret token
- **⚠️ IMPORTANT**: Never expose this in client-side code!

### 4. Webhook Secret
- Go to **Integrations** → **Webhooks** in Adapty dashboard
- Set webhook URL: `https://your-api.com/api/v1/subscription/webhook`
- Copy the webhook secret for signature verification

## 🛠️ Configuration in Adapty Dashboard

### Products & Access Levels
Make sure your Adapty dashboard has these configured:

#### Products:
- Create products in **App Store Connect** (iOS) and **Google Play Console** (Android)
- Import these products into Adapty dashboard
- Default product IDs:
  - `lyra_pro_monthly` (or your custom `ADAPTY_PRO_PRODUCT_ID`)
  - `lyra_premium_monthly` (or your custom `ADAPTY_PREMIUM_PRODUCT_ID`)
  - `lyra_pro_yearly` (or your custom `ADAPTY_PRO_YEARLY_PRODUCT_ID`)
  - `lyra_premium_yearly` (or your custom `ADAPTY_PREMIUM_YEARLY_PRODUCT_ID`)

#### Access Levels:
- `pro` (or your custom `ADAPTY_PRO_ACCESS_LEVEL_ID`)
- `premium` (or your custom `ADAPTY_PREMIUM_ACCESS_LEVEL_ID`)

#### Paywalls:
- Create a "default" paywall with your products
- Configure paywall design and pricing experiments

## ✅ Environment Variables Priority

The code uses this priority order:
1. Environment variable (if set)
2. Default hardcoded value (if environment variable is missing)

This means you can:
- Use defaults by not setting any optional environment variables
- Override specific values by setting only the environment variables you want to customize
- Have full control by setting all environment variables

## 🔧 Example Complete Setup

### Backend .env
```bash
# Required
ADAPTY_SECRET_TOKEN=secret_live_abcdef1234567890
ADAPTY_WEBHOOK_SECRET=whsec_1234567890abcdef

# Optional - customize product names
ADAPTY_PRO_PRODUCT_ID=myapp_pro_monthly
ADAPTY_PREMIUM_PRODUCT_ID=myapp_premium_monthly

# Optional - customize access levels
ADAPTY_PRO_ACCESS_LEVEL_ID=pro_features
ADAPTY_PREMIUM_ACCESS_LEVEL_ID=premium_features
```

### Frontend .env
```bash
# Required
EXPO_PUBLIC_ADAPTY_PUBLIC_SDK_KEY=public_live_1234567890abcdef

# Optional - match backend customer user ID format
EXPO_PUBLIC_ADAPTY_CUSTOMER_USER_ID_PREFIX=user_
```

## 🚨 Security Notes

1. **Never commit API keys** to version control
2. **Use different keys** for development/staging/production
3. **Rotate keys regularly** for security
4. **Secret token** should only be used on your backend server
5. **Public keys** are safe for client-side use but still shouldn't be committed

## 🧪 Testing

To test your configuration:
1. Set up sandbox/test keys first (`public_test_` and `secret_test_`)
2. Test purchase flow in simulator/emulator
3. Verify webhook delivery in Adapty dashboard
4. Check subscription status synchronization
5. Test paywall displays and A/B experiments

## 📱 App Store/Play Store

Don't forget to also configure:
- **iOS**: In-app purchase products in App Store Connect
- **Android**: In-app billing products in Google Play Console
- Import these store products into Adapty dashboard
- Link products to access levels in Adapty

## 🎯 Advantages Over RevenueCat

### **Simpler Setup:**
- ✅ **10K MTR Free** (vs $8/month for RevenueCat)
- ✅ **Better A/B Testing** built-in with visual paywall builder
- ✅ **18 Analytics Metrics** (vs 7 in RevenueCat)
- ✅ **Advanced Segmentation** capabilities
- ✅ **Less Backend Complexity** - Adapty handles more server-side

### **Better Features:**
- ✅ **Visual Paywall Builder** with drag-and-drop
- ✅ **Multivariate Testing** for pricing and design
- ✅ **Advanced User Segmentation**
- ✅ **Cohort Analysis** and LTV prediction
- ✅ **A/B Testing Dashboard** with statistical significance

## 🔧 Migration from RevenueCat

If you're migrating from RevenueCat:

### Database Model Updates
Update your Subscription model to replace:
- `revenueCatAppUserId` → `adaptyCustomerUserId`
- `revenueCatProductId` → `adaptyProductId`
- `revenueCatTransactionId` → `adaptyTransactionId`
- `revenueCatOriginalTransactionId` → `adaptyOriginalTransactionId`

### Webhook Headers
Update webhook signature header from:
- `x-revenuecat-signature` → `adapty-signature`

### Environment Variables
Replace RevenueCat env vars:
- `REVENUECAT_SECRET_KEY` → `ADAPTY_SECRET_TOKEN`
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` → `EXPO_PUBLIC_ADAPTY_PUBLIC_SDK_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` → `EXPO_PUBLIC_ADAPTY_PUBLIC_SDK_KEY` (same key)

## 📊 Free Tier Benefits

Adapty's free tier includes:
- **10,000 MTR** (Monthly Tracked Revenue) free
- **Unlimited app installs**
- **Basic analytics and metrics**
- **SDK access for iOS/Android/React Native**
- **Remote paywall configuration**
- **Basic A/B testing**

## 🎉 Next Steps

1. **Create Adapty account** at [adapty.io](https://adapty.io)
2. **Set up your app** and get API keys
3. **Configure products** in App Store Connect and Google Play Console  
4. **Import products** into Adapty dashboard
5. **Create access levels** and paywalls
6. **Add environment variables** to your project
7. **Test purchases** in sandbox environment
8. **Deploy to production** with live keys

## 🆘 Support Resources

- [Adapty Documentation](https://docs.adapty.io/)
- [React Native SDK Guide](https://adapty.io/docs/sdk-installation-reactnative)
- [Dashboard Tutorial](https://adapty.io/docs/dashboard-overview)
- [Migration Guide](https://adapty.io/docs/migration-guide)

## 🎊 Congratulations!

With Adapty configured, your app will have:
- ✅ **Free 10K MTR** subscription management
- ✅ **Advanced A/B testing** capabilities
- ✅ **Better analytics** (18 metrics vs RevenueCat's 7)
- ✅ **Visual paywall builder** for easy customization
- ✅ **Simpler backend integration**
- ✅ **Better mobile-first experience**

Your subscription system is now powered by a more modern, feature-rich platform!