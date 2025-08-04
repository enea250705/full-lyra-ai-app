// Feature flags for controlling app functionality
export const FEATURES = {
  // Core features (always enabled)
  MOOD_TRACKING: true,
  ENERGY_TRACKING: true,
  SLEEP_TRACKING: true,
  JOURNAL: true,
  AI_CHAT: true,
  DAILY_CHECKINS: true,
  INSIGHTS: true,
  
  // Health integrations
  APPLE_HEALTH: true,
  GOOGLE_FIT: true,
  
  // External integrations (can be toggled)
  PLAID_FINANCE: false,  // Set to true when ready to launch
  WEATHER_INTEGRATION: true,
  
  // Premium features
  ADVANCED_ANALYTICS: true,
  SAVINGS_TRACKING: true,
  FOCUS_SESSIONS: true,
  
  // Subscription system
  NATIVE_SUBSCRIPTIONS: true,
  
  // Admin features
  PUSH_NOTIFICATIONS: true,
} as const;

// Coming soon features with metadata
export const COMING_SOON_FEATURES = {
  PLAID_FINANCE: {
    title: 'Smart Financial Insights',
    description: 'Connect your bank accounts to get AI-powered spending analysis, savings recommendations, and automated expense tracking.',
    icon: '💳',
    estimatedDate: 'Q2 2025',
    benefits: [
      'Automatic expense categorization',
      'Personalized savings opportunities',
      'Real-time spending alerts',
      'Financial health score',
    ],
  },
  // Add more coming soon features here
} as const;

// Helper function to check if feature is enabled
export const isFeatureEnabled = (feature: keyof typeof FEATURES): boolean => {
  return FEATURES[feature] === true;
};

// Helper function to get coming soon feature info
export const getComingSoonFeature = (feature: keyof typeof COMING_SOON_FEATURES) => {
  return COMING_SOON_FEATURES[feature];
};