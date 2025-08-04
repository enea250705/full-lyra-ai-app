import { useAdapty } from '../hooks/useAdapty';
import { useSubscription } from '../hooks/useSubscription';
import { useUserData } from '../hooks/useUserData';
import apiService from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdaptyIntegrationState {
  isLoading: boolean;
  error: string | null;
}

export class AdaptyIntegration {
  private adapty: ReturnType<typeof useAdapty>;
  private subscription: ReturnType<typeof useSubscription>;
  private userData: ReturnType<typeof useUserData>;

  constructor(
    adapty: ReturnType<typeof useAdapty>,
    subscription: ReturnType<typeof useSubscription>,
    userData: ReturnType<typeof useUserData>
  ) {
    this.adapty = adapty;
    this.subscription = subscription;
    this.userData = userData;
  }

  /**
   * Initialize Adapty with authenticated user
   */
  async initializeWithUser(): Promise<void> {
    try {
      // Get authenticated user ID from AsyncStorage
      const authToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (!authToken || !storedUser) {
        throw new Error('User not authenticated');
      }
      
      const user = JSON.parse(storedUser);
      const userId = user.id;
      
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      // Set Adapty customer user ID
      const customerUserId = `user_${userId}`;
      await this.adapty.setCustomerUserId(customerUserId);
      
      console.log(`Adapty initialized with customer user ID: ${customerUserId}`);
    } catch (error) {
      console.error('Failed to initialize Adapty with user:', error);
      throw new Error('Failed to initialize Adapty with authenticated user');
    }
  }

  /**
   * Purchase a subscription plan through Adapty
   */
  async purchaseSubscription(planId: string): Promise<boolean> {
    try {
      // First, prepare subscription on backend
      const response = await apiService.createSubscription(planId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to prepare subscription');
      }

      const { customerUserId, productId } = response.data;

      // Ensure Adapty customer user ID matches
      await this.adapty.setCustomerUserId(customerUserId);

      // Get Adapty paywalls
      const paywalls = await this.adapty.getPaywalls();
      if (!paywalls || paywalls.length === 0) {
        throw new Error('No Adapty paywalls available');
      }

      // Find the default paywall or first paywall
      const paywall = paywalls.find(p => p.placementId === 'default') || paywalls[0];
      if (!paywall) {
        throw new Error('No suitable paywall found');
      }

      // Get products for the paywall
      const products = await this.adapty.getPaywallProducts(paywall);
      if (!products || products.length === 0) {
        throw new Error('No products found in paywall');
      }

      // Find the product for this plan
      const productToPurchase = products.find(
        product => product.vendorProductId === productId
      );

      if (!productToPurchase) {
        throw new Error(`Product ${productId} not found in Adapty paywall`);
      }

      // Log paywall show event
      await this.adapty.logShowPaywall(paywall);

      // Make the purchase
      const purchaseResult = await this.adapty.purchaseProduct(productToPurchase);
      
      if (!purchaseResult.success) {
        throw new Error(purchaseResult.error?.message || 'Purchase failed');
      }

      // Refresh subscription state from backend
      await this.subscription.fetchSubscription();

      return true;
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  /**
   * Restore purchases and sync with backend
   */
  async restorePurchases(): Promise<boolean> {
    try {
      const restoreResult = await this.adapty.restorePurchases();
      
      if (restoreResult.success) {
        // Refresh subscription state from backend
        await this.subscription.fetchSubscription();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Restore purchases failed:', error);
      return false;
    }
  }

  /**
   * Sync Adapty state with backend subscription (client-side)
   */
  async syncSubscriptionState(): Promise<void> {
    try {
      // Get current Adapty profile
      const profile = await this.adapty.getProfile();
      
      if (profile) {
        // Sync profile data to backend
        const response = await fetch('/api/v1/subscription/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({
            adaptyProfile: profile,
          }),
        });
        
        if (response.ok) {
          // Refresh backend subscription
          await this.subscription.fetchSubscription();
        }
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  /**
   * Get unified subscription status
   */
  getUnifiedSubscriptionStatus() {
    const adaptyPlan = this.adapty.getCurrentPlan();
    const backendSubscription = this.subscription.subscription;

    return {
      adapty: {
        plan: adaptyPlan,
        isProActive: this.adapty.isProActive,
        isPremiumActive: this.adapty.isPremiumActive,
        activeSubscriptions: this.adapty.activeSubscriptions,
        profile: this.adapty.profile,
      },
      backend: {
        plan: backendSubscription?.plan || 'free',
        status: backendSubscription?.status || 'unknown',
        isActive: backendSubscription?.isActive || false,
      },
      isInSync: adaptyPlan === (backendSubscription?.plan || 'free'),
    };
  }

  /**
   * Check if a feature is available for the current user
   */
  isFeatureAvailable(featureId: string): boolean {
    return this.adapty.isFeatureAvailable(featureId);
  }

  /**
   * Get current subscription plan
   */
  getCurrentPlan(): string {
    return this.adapty.getCurrentPlan();
  }

  /**
   * Check if user has specific access level
   */
  hasAccessLevel(accessLevelId: string): boolean {
    return this.adapty.hasAccessLevel(accessLevelId);
  }

  /**
   * Get access level expiration date
   */
  getAccessLevelExpirationDate(accessLevelId: string): Date | null {
    return this.adapty.getAccessLevelExpirationDate(accessLevelId);
  }

  /**
   * Update user profile attributes
   */
  async updateUserProfile(attributes: Record<string, any>): Promise<void> {
    try {
      await this.adapty.updateProfile(attributes);
    } catch (error) {
      console.error('Failed to update user profile:', error);
    }
  }

  /**
   * Get paywalls for display
   */
  async getPaywalls() {
    try {
      return await this.adapty.getPaywalls();
    } catch (error) {
      console.error('Failed to get paywalls:', error);
      return null;
    }
  }

  /**
   * Get products for a specific paywall
   */
  async getPaywallProducts(paywall: any) {
    try {
      return await this.adapty.getPaywallProducts(paywall);
    } catch (error) {
      console.error('Failed to get paywall products:', error);
      return [];
    }
  }
}

// Hook to use Adapty integration
export const useAdaptyIntegration = () => {
  const adapty = useAdapty();
  const subscription = useSubscription();
  const userData = useUserData();

  const integration = new AdaptyIntegration(adapty, subscription, userData);

  return {
    // Expose integration methods
    initializeWithUser: integration.initializeWithUser.bind(integration),
    purchaseSubscription: integration.purchaseSubscription.bind(integration),
    restorePurchases: integration.restorePurchases.bind(integration),
    syncSubscriptionState: integration.syncSubscriptionState.bind(integration),
    getUnifiedSubscriptionStatus: integration.getUnifiedSubscriptionStatus.bind(integration),
    isFeatureAvailable: integration.isFeatureAvailable.bind(integration),
    getCurrentPlan: integration.getCurrentPlan.bind(integration),
    hasAccessLevel: integration.hasAccessLevel.bind(integration),
    getAccessLevelExpirationDate: integration.getAccessLevelExpirationDate.bind(integration),
    updateUserProfile: integration.updateUserProfile.bind(integration),
    getPaywalls: integration.getPaywalls.bind(integration),
    getPaywallProducts: integration.getPaywallProducts.bind(integration),
    // Expose individual hook states for convenience
    adapty,
    subscription,
    userData,
  };
};