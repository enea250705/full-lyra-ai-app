import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import nativeSubscriptionService, { SubscriptionStatus, PurchaseResult } from '../services/nativeSubscriptionService';
import { Subscription } from 'react-native-iap';

interface UseNativeSubscriptionReturn {
  // Subscription status
  subscriptionStatus: SubscriptionStatus;
  isLoading: boolean;
  error: string | null;
  
  // Available products
  availableProducts: Subscription[];
  
  // Actions
  initialize: () => Promise<boolean>;
  purchaseSubscription: (productId: string) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  hasAccessToFeature: (featureId: string) => Promise<boolean>;
  
  // Convenience getters
  isProActive: boolean;
  isPremiumActive: boolean;
  isFree: boolean;
  currentPlan: 'free' | 'pro' | 'premium';
}

export const useNativeSubscription = (): UseNativeSubscriptionReturn => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isActive: false,
    isPro: false,
    isPremium: false,
    plan: 'free',
  });
  
  const [availableProducts, setAvailableProducts] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize the subscription service
   */
  const initialize = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await nativeSubscriptionService.initialize();
      
      if (success) {
        // Load products and current status
        const products = await nativeSubscriptionService.loadProducts();
        const status = await nativeSubscriptionService.getSubscriptionStatus();
        
        setAvailableProducts(products);
        setSubscriptionStatus(status);
        
        return true;
      } else {
        setError('Failed to initialize subscription service');
        return false;
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Initialization failed';
      setError(errorMsg);
      console.error('[useNativeSubscription] Initialization error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Purchase a subscription
   */
  const purchaseSubscription = useCallback(async (productId: string): Promise<PurchaseResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await nativeSubscriptionService.purchaseSubscription(productId);
      
      if (result.success) {
        // Refresh subscription status after successful purchase
        await refreshStatus();
        
        Alert.alert(
          'Purchase Successful! 🎉',
          'Your subscription has been activated. Enjoy your premium features!',
          [{ text: 'Awesome!' }]
        );
      } else {
        setError(result.error || 'Purchase failed');
        
        Alert.alert(
          'Purchase Failed',
          result.error || 'Unable to complete your purchase. Please try again.',
          [{ text: 'OK' }]
        );
      }
      
      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Purchase error occurred';
      setError(errorMsg);
      console.error('[useNativeSubscription] Purchase error:', err);
      
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Restore previous purchases
   */
  const restorePurchases = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await nativeSubscriptionService.restorePurchases();
      
      // Check if any restore was successful
      const hasSuccessfulRestore = results.some(result => result.success);
      
      if (hasSuccessfulRestore) {
        await refreshStatus();
        
        Alert.alert(
          'Restore Successful! ✨',
          'Your previous purchases have been restored.',
          [{ text: 'Great!' }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any previous purchases to restore.',
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Restore failed';
      setError(errorMsg);
      console.error('[useNativeSubscription] Restore error:', err);
      
      Alert.alert(
        'Restore Failed',
        'Unable to restore your purchases. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh subscription status
   */
  const refreshStatus = useCallback(async (): Promise<void> => {
    try {
      const status = await nativeSubscriptionService.getSubscriptionStatus();
      setSubscriptionStatus(status);
      setError(null);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to refresh status';
      setError(errorMsg);
      console.error('[useNativeSubscription] Refresh status error:', err);
    }
  }, []);

  /**
   * Check feature access
   */
  const hasAccessToFeature = useCallback(async (featureId: string): Promise<boolean> => {
    try {
      return await nativeSubscriptionService.hasAccessToFeature(featureId);
    } catch (err: any) {
      console.error('[useNativeSubscription] Feature access check error:', err);
      return false;
    }
  }, []);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    initialize();
  }, [initialize]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      nativeSubscriptionService.dispose();
    };
  }, []);

  // Convenience getters
  const isProActive = subscriptionStatus.isPro;
  const isPremiumActive = subscriptionStatus.isPremium;
  const isFree = subscriptionStatus.plan === 'free';
  const currentPlan = subscriptionStatus.plan;

  return {
    // State
    subscriptionStatus,
    isLoading,
    error,
    availableProducts,
    
    // Actions
    initialize,
    purchaseSubscription,
    restorePurchases,
    refreshStatus,
    hasAccessToFeature,
    
    // Convenience getters
    isProActive,
    isPremiumActive,
    isFree,
    currentPlan,
  };
};