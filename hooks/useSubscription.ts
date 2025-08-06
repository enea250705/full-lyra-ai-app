import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  features: Feature[];
  limits: PlanLimits;
  popular?: boolean;
}

interface Feature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface PlanLimits {
  dataRetentionDays: number;
  maxGoals: number;
  maxNotifications: number;
  maxInterventions: number;
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  isActive: boolean;
  isPro: boolean;
  isPremium: boolean;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  dataRetentionDays: number;
}

interface SubscriptionState {
  subscription: Subscription | null;
  plans: Plan[];
  isLoading: boolean;
  error: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  
  // Developer override: Grant full Premium access to eneamuja87@gmail.com
  const isDeveloperAccount = user?.email === 'eneamuja87@gmail.com';
  
  const [state, setState] = useState<SubscriptionState>({
    subscription: isDeveloperAccount ? {
      id: 'dev-premium',
      plan: 'premium',
      status: 'active',
      isActive: true,
      isPro: true,
      isPremium: true,
      cancelAtPeriodEnd: false,
      dataRetentionDays: -1,
    } : null,
    plans: [],
    isLoading: false,
    error: null,
  });

  const fetchSubscription = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    // Developer override: Return premium subscription for eneamuja87@gmail.com
    if (isDeveloperAccount) {
      const devSubscription = {
        id: 'dev-premium',
        plan: 'premium',
        status: 'active',
        isActive: true,
        isPro: true,
        isPremium: true,
        cancelAtPeriodEnd: false,
        dataRetentionDays: -1,
      };
      
      setState(prev => ({
        ...prev,
        subscription: devSubscription,
        isLoading: false,
      }));
      return devSubscription;
    }
    
    try {
      const response = await apiService.getSubscription();
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          subscription: response.data.subscription,
          isLoading: false,
        }));
        return response.data.subscription;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Failed to fetch subscription',
        }));
        return null;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch subscription',
      }));
      return null;
    }
  };

  const fetchPlans = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiService.getPlans();
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          plans: response.data.plans,
          isLoading: false,
        }));
        return response.data.plans;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Failed to fetch plans',
        }));
        return [];
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch plans',
      }));
      return [];
    }
  };

  const createSubscription = async (planId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiService.createSubscription(planId);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          subscription: response.data.subscription,
          isLoading: false,
        }));
        return response.data;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Failed to create subscription',
        }));
        return null;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to create subscription',
      }));
      return null;
    }
  };

  const updateSubscription = async (planId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiService.updateSubscription(planId);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          subscription: response.data.subscription,
          isLoading: false,
        }));
        return response.data.subscription;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Failed to update subscription',
        }));
        return null;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to update subscription',
      }));
      return null;
    }
  };

  const cancelSubscription = async (immediate: boolean = false) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiService.cancelSubscription(immediate);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          subscription: response.data.subscription,
          isLoading: false,
        }));
        return response.data.subscription;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Failed to cancel subscription',
        }));
        return null;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to cancel subscription',
      }));
      return null;
    }
  };

  const getCustomerPortal = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiService.getCustomerPortal();
      
      if (response.success) {
        setState(prev => ({ ...prev, isLoading: false }));
        return response.data.managementUrl;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Failed to get customer portal',
        }));
        return null;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to get customer portal',
      }));
      return null;
    }
  };

  const checkFeatureAccess = async (featureId: string) => {
    try {
      const response = await apiService.checkFeatureAccess(featureId);
      
      if (response.success) {
        return response.data.hasAccess;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const hasFeature = (featureId: string): boolean => {
    // Developer override: Grant access to all features for eneamuja87@gmail.com
    if (isDeveloperAccount) {
      return true;
    }
    
    if (!state.subscription) return false;
    
    const currentPlan = state.plans.find(plan => plan.id === state.subscription?.plan);
    if (!currentPlan) return false;
    
    return currentPlan.features.some(feature => feature.id === featureId && feature.enabled);
  };

  const canUpgrade = (): boolean => {
    if (!state.subscription) return true;
    return state.subscription.plan !== 'premium';
  };

  const canDowngrade = (): boolean => {
    if (!state.subscription) return false;
    return state.subscription.plan !== 'free';
  };

  const getUpgradeOptions = (): Plan[] => {
    if (!state.subscription) return state.plans.filter(plan => plan.id !== 'free');
    
    const currentPlan = state.subscription.plan;
    if (currentPlan === 'free') {
      return state.plans.filter(plan => plan.id !== 'free');
    } else if (currentPlan === 'pro') {
      return state.plans.filter(plan => plan.id === 'premium');
    }
    return [];
  };

  const isFeatureRestricted = (featureId: string): boolean => {
    return !hasFeature(featureId);
  };

  // Load initial data
  useEffect(() => {
    fetchSubscription();
    fetchPlans();
  }, []);

  return {
    ...state,
    fetchSubscription,
    fetchPlans,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    getCustomerPortal,
    checkFeatureAccess,
    hasFeature,
    canUpgrade,
    canDowngrade,
    getUpgradeOptions,
    isFeatureRestricted,
  };
};