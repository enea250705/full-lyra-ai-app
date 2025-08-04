import { useState, useEffect } from 'react';
import { adapty } from 'react-native-adapty';
import type {
  AdaptyProfile,
  AdaptyPaywall,
  AdaptyPaywallProduct,
  AdaptyPurchasedInfo,
  AdaptyError,
  LogLevel
} from 'react-native-adapty';
import { Platform } from 'react-native';

interface AdaptyState {
  isLoading: boolean;
  error: string | null;
  profile: AdaptyProfile | null;
  paywalls: AdaptyPaywall[] | null;
  isProActive: boolean;
  isPremiumActive: boolean;
  activeSubscriptions: string[];
}

export const useAdapty = () => {
  const [state, setState] = useState<AdaptyState>({
    isLoading: false,
    error: null,
    profile: null,
    paywalls: null,
    isProActive: false,
    isPremiumActive: false,
    activeSubscriptions: [],
  });

  const initializeAdapty = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Check if native module is available
      if (!adapty) {
        console.warn('[Adapty] Native module not available - running in simulation mode');
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Native module not available' 
        }));
        return;
      }

      // Get API key from environment
      const apiKey = process.env.EXPO_PUBLIC_ADAPTY_PUBLIC_SDK_KEY;
      
      if (!apiKey) {
        throw new Error('EXPO_PUBLIC_ADAPTY_PUBLIC_SDK_KEY environment variable is required');
      }

      // Configure Adapty
      await adapty.activate(apiKey, {
        observerMode: false,
        customerUserId: null, // Will be set later with user authentication
        logLevel: LogLevel.ERROR,
      });

      // Get initial profile
      const profile = await adapty.getProfile();
      updateProfile(profile);

      // Get paywalls
      const paywalls = await adapty.getPaywalls();
      setState(prev => ({
        ...prev,
        paywalls,
        isLoading: false,
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize Adapty',
      }));
    }
  };

  const updateProfile = (profile: AdaptyProfile) => {
    // Check for active subscriptions based on access levels
    const activeSubscriptions: string[] = [];
    let isProActive = false;
    let isPremiumActive = false;

    // Check access levels for Pro and Premium entitlements
    if (profile.accessLevels?.pro?.isActive) {
      isProActive = true;
      activeSubscriptions.push('pro');
    }

    if (profile.accessLevels?.premium?.isActive) {
      isPremiumActive = true;
      activeSubscriptions.push('premium');
    }

    setState(prev => ({
      ...prev,
      profile,
      activeSubscriptions,
      isProActive,
      isPremiumActive,
    }));
  };

  const setCustomerUserId = async (userID: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await adapty.identify(userID);
      const profile = await adapty.getProfile();
      updateProfile(profile);
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to set user ID',
      }));
    }
  };

  const purchaseProduct = async (product: AdaptyPaywallProduct) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await adapty.makePurchase(product);
      
      if (result.profile) {
        updateProfile(result.profile);
      }
      
      setState(prev => ({ ...prev, isLoading: false }));
      
      return {
        success: true,
        profile: result.profile,
        transaction: result.transaction,
      };
    } catch (error) {
      const adaptyError = error as AdaptyError;
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: adaptyError.message || 'Failed to purchase product',
      }));
      
      return {
        success: false,
        error: adaptyError,
      };
    }
  };

  const restorePurchases = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const profile = await adapty.restorePurchases();
      updateProfile(profile);
      
      setState(prev => ({ ...prev, isLoading: false }));
      
      return { success: true, profile };
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to restore purchases',
      }));
      
      return { success: false, error };
    }
  };

  const getProfile = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const profile = await adapty.getProfile();
      updateProfile(profile);
      
      setState(prev => ({ ...prev, isLoading: false }));
      
      return profile;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get profile',
      }));
      
      return null;
    }
  };

  const getPaywalls = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const paywalls = await adapty.getPaywalls();
      
      setState(prev => ({
        ...prev,
        paywalls,
        isLoading: false,
      }));
      
      return paywalls;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get paywalls',
      }));
      
      return null;
    }
  };

  const getPaywallProducts = async (paywall: AdaptyPaywall) => {
    try {
      const products = await adapty.getPaywallProducts(paywall);
      return products;
    } catch (error) {
      console.error('Failed to get paywall products:', error);
      return [];
    }
  };

  const hasAccessLevel = (accessLevelId: string): boolean => {
    if (!state.profile) return false;
    return state.profile.accessLevels?.[accessLevelId]?.isActive || false;
  };

  const getAccessLevelExpirationDate = (accessLevelId: string): Date | null => {
    if (!state.profile) return null;
    
    const accessLevel = state.profile.accessLevels?.[accessLevelId];
    if (!accessLevel || !accessLevel.expiresAt) return null;
    
    return new Date(accessLevel.expiresAt);
  };

  const isFeatureAvailable = (featureId: string): boolean => {
    switch (featureId) {
      case 'ai_spending_intervention':
      case 'advanced_goal_tracking':
      case 'mood_spending_correlation':
      case 'calendar_management':
      case 'push_notifications':
      case 'savings_counter':
      case 'extended_data_history':
        return state.isProActive || state.isPremiumActive;
      
      case 'location_alerts':
      case 'sleep_correlation':
      case 'weather_mood_insights':
      case 'advanced_pattern_recognition':
      case 'sms_alerts':
      case 'custom_intervention_rules':
      case 'unlimited_data':
      case 'priority_support':
        return state.isPremiumActive;
      
      default:
        return true; // Free features
    }
  };

  const getCurrentPlan = (): string => {
    if (state.isPremiumActive) return 'premium';
    if (state.isProActive) return 'pro';
    return 'free';
  };

  const updateUserProfile = async (params: Record<string, any>) => {
    try {
      await adapty.updateProfile(params);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const logShowPaywall = async (paywall: AdaptyPaywall) => {
    try {
      await adapty.logShowPaywall(paywall);
    } catch (error) {
      console.error('Failed to log paywall show:', error);
    }
  };

  const logout = async () => {
    try {
      await adapty.logout();
      setState(prev => ({
        ...prev,
        profile: null,
        activeSubscriptions: [],
        isProActive: false,
        isPremiumActive: false,
      }));
    } catch (error) {
      console.error('Failed to logout from Adapty:', error);
    }
  };

  // Initialize Adapty on hook mount
  useEffect(() => {
    initializeAdapty();
  }, []);

  return {
    ...state,
    initializeAdapty,
    setCustomerUserId,
    purchaseProduct,
    restorePurchases,
    getProfile,
    getPaywalls,
    getPaywallProducts,
    hasAccessLevel,
    getAccessLevelExpirationDate,
    isFeatureAvailable,
    getCurrentPlan,
    updateUserProfile,
    logShowPaywall,
    logout,
  };
};