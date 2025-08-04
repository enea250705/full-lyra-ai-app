# 📱 Native Subscription Setup Guide

## 🍎 **Apple App Store Setup**

### 1. **App Store Connect Configuration**
1. **Go to:** [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **Navigate to:** Your App → Features → In-App Purchases
3. **Create subscription groups:**

#### **Subscription Group: "Lyra Pro Plans"**
- **Group Name:** Lyra Pro Plans
- **Group Reference Name:** lyra_pro_plans

#### **Individual Subscriptions:**

**Pro Monthly:**
- **Product ID:** `lyra_pro_monthly`
- **Reference Name:** Lyra Pro Monthly
- **Duration:** 1 Month
- **Price:** €9.99
- **Family Sharing:** Enabled
- **Introductory Offer:** 7-day free trial

**Pro Yearly:**
- **Product ID:** `lyra_pro_yearly`
- **Reference Name:** Lyra Pro Yearly  
- **Duration:** 1 Year
- **Price:** €99.99 (2 months free)
- **Family Sharing:** Enabled
- **Introductory Offer:** 7-day free trial

**Premium Monthly:**
- **Product ID:** `lyra_premium_monthly`
- **Reference Name:** Lyra Premium Monthly
- **Duration:** 1 Month
- **Price:** €19.99
- **Family Sharing:** Enabled
- **Introductory Offer:** 3-day free trial

**Premium Yearly:**
- **Product ID:** `lyra_premium_yearly`
- **Reference Name:** Lyra Premium Yearly
- **Duration:** 1 Year
- **Price:** €199.99 (2 months free)
- **Family Sharing:** Enabled
- **Introductory Offer:** 3-day free trial

### 2. **Required App Metadata**
- **Privacy Policy URL:** Required for subscriptions
- **Terms of Service URL:** Required for subscriptions
- **Subscription Terms:** Must explain auto-renewal, pricing, cancellation

### 3. **StoreKit Configuration**
Create `Products.storekit` file in Xcode:
```json
{
  "identifier" : "Configuration",
  "nonRenewingSubscriptions" : [],
  "products" : [],
  "settings" : {},
  "subscriptionGroups" : [
    {
      "id" : "21482820",
      "localizations" : [],
      "name" : "Lyra Pro Plans",
      "subscriptions" : [
        {
          "adHocOffers" : [],
          "codeOffers" : [],
          "displayPrice" : "9.99",
          "familyShareable" : true,
          "id" : "lyra_pro_monthly",
          "introductoryOffer" : {
            "displayPrice" : "0.00",
            "duration" : "P1W",
            "id" : "intro_offer_1",
            "paymentMode" : "free"
          },
          "localizations" : [
            {
              "description" : "AI-powered spending protection with mood correlation and smart interventions",
              "displayName" : "Lyra Pro",
              "locale" : "en_US"
            }
          ],
          "productId" : "lyra_pro_monthly",
          "recurringSubscriptionPeriod" : "P1M",
          "referenceName" : "Pro Monthly"
        }
      ]
    }
  ],
  "version" : {
    "major" : 3,
    "minor" : 0
  }
}
```

---

## 🤖 **Google Play Store Setup**

### 1. **Google Play Console Configuration**
1. **Go to:** [play.google.com/console](https://play.google.com/console)
2. **Navigate to:** Your App → Monetize → Products → Subscriptions
3. **Create subscription products:**

#### **Subscription Products:**

**Pro Monthly:**
- **Product ID:** `lyra_pro_monthly`
- **Name:** Lyra Pro
- **Description:** AI-powered spending protection
- **Billing Period:** 1 month
- **Price:** €9.99
- **Free Trial:** 7 days
- **Grace Period:** 3 days

**Pro Yearly:**
- **Product ID:** `lyra_pro_yearly`
- **Name:** Lyra Pro (Yearly)
- **Description:** AI-powered spending protection - Save 17%
- **Billing Period:** 12 months
- **Price:** €99.99
- **Free Trial:** 7 days

**Premium Monthly:**
- **Product ID:** `lyra_premium_monthly`
- **Name:** Lyra Premium
- **Description:** Complete life operating system with unlimited features
- **Billing Period:** 1 month
- **Price:** €19.99
- **Free Trial:** 3 days

**Premium Yearly:**
- **Product ID:** `lyra_premium_yearly`
- **Name:** Lyra Premium (Yearly)
- **Description:** Complete life operating system - Save 17%
- **Billing Period:** 12 months
- **Price:** €199.99
- **Free Trial:** 3 days

### 2. **Required Policies**
- **Privacy Policy:** Must be uploaded to Play Console
- **Terms of Service:** Required for subscriptions
- **Data Safety Section:** Complete in Play Console

---

## 💻 **Code Implementation**

### 1. **Update Product IDs in Code**
Update your existing subscription service:

```typescript
// constants/subscriptions.ts
export const SUBSCRIPTION_PRODUCTS = {
  PRO_MONTHLY: 'lyra_pro_monthly',
  PRO_YEARLY: 'lyra_pro_yearly',
  PREMIUM_MONTHLY: 'lyra_premium_monthly',
  PREMIUM_YEARLY: 'lyra_premium_yearly',
} as const;

export const SUBSCRIPTION_PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    monthlyProductId: SUBSCRIPTION_PRODUCTS.PRO_MONTHLY,
    yearlyProductId: SUBSCRIPTION_PRODUCTS.PRO_YEARLY,
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    features: ['AI Interventions', 'Mood Correlation', 'Savings Counter'],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    monthlyProductId: SUBSCRIPTION_PRODUCTS.PREMIUM_MONTHLY,
    yearlyProductId: SUBSCRIPTION_PRODUCTS.PREMIUM_YEARLY,
    monthlyPrice: 19.99,
    yearlyPrice: 199.99,
    features: ['Everything in Pro', 'Location Alerts', 'SMS Notifications', 'Unlimited Data'],
  },
];
```

### 2. **Native Receipt Validation**
Your existing `nativeReceiptService.ts` handles this! ✅

### 3. **Subscription Status Sync**
Update backend to sync with your existing subscription system.

---

## 🧪 **Testing Setup**

### **iOS Testing:**
1. **Sandbox Accounts:** Create in App Store Connect
2. **Test Environment:** Use iOS Simulator or device with sandbox account
3. **StoreKit Testing:** Use local StoreKit configuration file

### **Android Testing:**
1. **Test Accounts:** Add testers in Play Console
2. **Test Tracks:** Use internal testing track
3. **Test Purchases:** Use Google Play's test payment methods

---

## 📋 **Pre-Launch Checklist**

### **Apple App Store:**
- [ ] Subscription products created and approved
- [ ] StoreKit configuration file added to Xcode
- [ ] Privacy Policy and Terms of Service URLs added
- [ ] App metadata includes subscription terms
- [ ] Tested with sandbox account
- [ ] Receipt validation working

### **Google Play Store:**
- [ ] Subscription products created and activated
- [ ] Privacy Policy uploaded to Play Console
- [ ] Data Safety section completed
- [ ] Tested with test account
- [ ] Receipt validation working

### **Backend:**
- [ ] Product IDs match store configuration
- [ ] Receipt validation endpoints working
- [ ] Subscription status sync implemented
- [ ] Webhook handling for subscription events

---

## 🚀 **Launch Strategy**

### **Pricing Strategy:**
- **Free Trial:** Hook users with 7-day Pro trial
- **Yearly Discount:** 17% savings encourages longer commitment
- **Value Messaging:** Emphasize ROI (saves 15-30x subscription cost)

### **Conversion Optimization:**
- **Paywall Timing:** Show after user sees first AI intervention
- **Social Proof:** "Users save €200+ monthly on average"
- **Urgency:** "Limited time: 7-day free trial"

### **Revenue Projections:**
- **Target:** 25% free → Pro conversion
- **ARPU:** €4-6/month (including free users)
- **LTV:** €50-80 per paying user

This setup gives you complete control over subscriptions without third-party fees (except Apple/Google's 30%)!