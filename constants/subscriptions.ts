// Native subscription product IDs - must match App Store Connect and Google Play Console
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
    tagline: 'AI-Powered Protection',
    monthlyProductId: SUBSCRIPTION_PRODUCTS.PRO_MONTHLY,
    yearlyProductId: SUBSCRIPTION_PRODUCTS.PRO_YEARLY,
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    yearlyDiscount: 17, // percentage
    currency: 'EUR',
    popular: true,
    freeTrialDays: 7,
    features: [
      'AI Spending Interventions',
      'Mood-Spending Correlation',
      'Real-time Push Notifications',
      'Savings Counter',
      'Advanced Goal Tracking',
      '180-day Data Retention',
      '100 Interventions/month'
    ],
    benefits: [
      'Save €150-300/month on average',
      'Smart protection when you need it most',
      'Understand your spending triggers'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'Complete Life Operating System',
    monthlyProductId: SUBSCRIPTION_PRODUCTS.PREMIUM_MONTHLY,
    yearlyProductId: SUBSCRIPTION_PRODUCTS.PREMIUM_YEARLY,
    monthlyPrice: 19.99,
    yearlyPrice: 199.99,
    yearlyDiscount: 17, // percentage
    currency: 'EUR',
    freeTrialDays: 3,
    features: [
      'Everything in Pro',
      'Location-Based Alerts',
      'Sleep Correlation Analysis',
      'Weather-Mood Insights',
      'SMS Emergency Alerts',
      'Custom Intervention Rules',
      'Unlimited Data History',
      'Priority Support'
    ],
    benefits: [
      'Maximum protection everywhere',
      'Deep behavioral insights',
      'Complete spending control'
    ]
  },
];

export const FREE_PLAN = {
  id: 'free',
  name: 'Free',
  tagline: 'Getting Started',
  price: 0,
  features: [
    'Basic Spending Tracking',
    'Daily Mood Check-ins',
    'Simple Goal Setting (3 max)',
    'Weekly Email Reports',
    '30-day Data Retention'
  ],
  limitations: [
    'No AI interventions',
    'Limited data history',
    'Basic notifications only'
  ]
};

// Helper functions
export const getPlanById = (planId: string) => {
  if (planId === 'free') return FREE_PLAN;
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
};

export const getProductById = (productId: string) => {
  for (const plan of SUBSCRIPTION_PLANS) {
    if (plan.monthlyProductId === productId || plan.yearlyProductId === productId) {
      return {
        plan,
        isYearly: plan.yearlyProductId === productId
      };
    }
  }
  return null;
};

export const calculateYearlySavings = (monthlyPrice: number, yearlyPrice: number) => {
  const monthlyTotal = monthlyPrice * 12;
  return monthlyTotal - yearlyPrice;
};