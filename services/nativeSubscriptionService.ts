let RNIap: any;
try {
  // Dynamically require to avoid crashing in Expo/web where the native module isn't available
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  RNIap = require('react-native-iap');
} catch (_e) {
  RNIap = null;
}

import type {
  Product,
  Subscription,
  Purchase,
  PurchaseError,
  SubscriptionPurchase,
  ProductPurchase,
} from 'react-native-iap';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './api';

// Product IDs - these must match exactly what you set up in App Store Connect and Google Play Console
export const SUBSCRIPTION_SKUS = Platform.select({
  ios: [
    'lyra_pro_monthly',     // iOS: com.lyra.ai.pro.monthly
    'lyra_premium_monthly', // iOS: com.lyra.ai.premium.monthly
  ],
  android: [
    'lyra_pro_monthly',     // Android: lyra_pro_monthly
    'lyra_premium_monthly', // Android: lyra_premium_monthly
  ],
}) || [];

export interface SubscriptionStatus {
  isActive: boolean;
  isPro: boolean;
  isPremium: boolean;
  plan: 'free' | 'pro' | 'premium';
  expirationDate?: string;
  autoRenewing?: boolean;
  originalTransactionId?: string;
  latestReceipt?: string;
}

export interface PurchaseResult {
  success: boolean;
  receipt?: string;
  transactionId?: string;
  error?: string;
}

class NativeSubscriptionService {
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;
  private isInitialized = false;
  private availableProducts: Subscription[] = [];

  /**
   * Initialize the IAP service
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('[IAP] Initializing native subscription service...');
      if (!RNIap) {
        console.warn('[IAP] react-native-iap not available (Expo/dev). Skipping init.');
        this.isInitialized = false;
        return false;
      }
      
      // Initialize connection to store
      await RNIap.initConnection();
      console.log('[IAP] Connection established');

      // Set up purchase listeners
      this.setupPurchaseListeners();

      // Load available products
      await this.loadProducts();

      this.isInitialized = true;
      console.log('[IAP] Initialization complete');
      return true;

    } catch (error) {
      console.error('[IAP] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Set up purchase listeners
   */
  private setupPurchaseListeners() {
    if (!RNIap) return;
    // Listen for successful purchases
    this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener((purchase: Purchase) => {
      console.log('[IAP] Purchase updated:', purchase);
      this.handlePurchaseUpdate(purchase);
    });

    // Listen for purchase errors
    this.purchaseErrorSubscription = RNIap.purchaseErrorListener((error: PurchaseError) => {
      console.warn('[IAP] Purchase error:', error);
      this.handlePurchaseError(error);
    });
  }

  /**
   * Load available subscription products
   */
  async loadProducts(): Promise<Subscription[]> {
    try {
      console.log('[IAP] Loading subscription products...');
      if (!RNIap) return [];
      const products = await RNIap.getSubscriptions({ skus: SUBSCRIPTION_SKUS });
      
      this.availableProducts = products;
      console.log('[IAP] Loaded products:', products.map(p => ({ id: p.productId, price: p.localizedPrice })));
      
      return products;
    } catch (error) {
      console.error('[IAP] Failed to load products:', error);
      return [];
    }
  }

  /**
   * Get available subscription products
   */
  getAvailableProducts(): Subscription[] {
    return this.availableProducts;
  }

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(productId: string): Promise<PurchaseResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      if (!RNIap) {
        return { success: false, error: 'IAP not available in this environment' };
      }

      console.log('[IAP] Initiating purchase for:', productId);
      
      const purchase = await RNIap.requestSubscription({
        sku: productId,
        ...(Platform.OS === 'android' && {
          // Android specific options
          purchaseTokenAndroid: undefined,
          prorationModeAndroid: undefined,
        }),
      });

      console.log('[IAP] Purchase successful:', purchase);

      // Validate receipt with backend
      const validationResult = await this.validateReceiptWithBackend(purchase);
      
      if (validationResult.success) {
        // Acknowledge purchase (required for Android)
        if (Platform.OS === 'android' && purchase.purchaseToken) {
          await RNIap.acknowledgePurchaseAndroid(purchase.purchaseToken);
        }

        return {
          success: true,
          receipt: purchase.transactionReceipt,
          transactionId: purchase.transactionId,
        };
      } else {
        throw new Error('Receipt validation failed');
      }

    } catch (error: any) {
      console.error('[IAP] Purchase failed:', error);
      return {
        success: false,
        error: error.message || 'Purchase failed',
      };
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<PurchaseResult[]> {
    try {
      console.log('[IAP] Restoring purchases...');
      
      const purchases = await RNIap.getAvailablePurchases();
      console.log('[IAP] Found available purchases:', purchases.length);

      const results: PurchaseResult[] = [];

      for (const purchase of purchases) {
        try {
          const validationResult = await this.validateReceiptWithBackend(purchase);
          results.push({
            success: validationResult.success,
            receipt: purchase.transactionReceipt,
            transactionId: purchase.transactionId,
            error: validationResult.success ? undefined : 'Validation failed',
          });
        } catch (error: any) {
          results.push({
            success: false,
            error: error.message || 'Restore failed',
          });
        }
      }

      return results;
    } catch (error: any) {
      console.error('[IAP] Restore failed:', error);
      return [{
        success: false,
        error: error.message || 'Restore failed',
      }];
    }
  }

  /**
   * Get current subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      // Get status from backend
      const response = await apiService.getSubscription();
      
      if (response.success && response.data) {
        const { plan, status, currentPeriodEnd, autoRenewing } = response.data;
        
        const isActive = status === 'active';
        const isPro = isActive && plan === 'pro';
        const isPremium = isActive && plan === 'premium';

        return {
          isActive,
          isPro,
          isPremium,
          plan: isActive ? plan : 'free',
          expirationDate: currentPeriodEnd,
          autoRenewing,
        };
      }
    } catch (error) {
      console.error('[IAP] Failed to get subscription status:', error);
    }

    // Default to free if anything fails
    return {
      isActive: false,
      isPro: false,
      isPremium: false,
      plan: 'free',
    };
  }

  /**
   * Validate receipt with backend
   */
  private async validateReceiptWithBackend(purchase: Purchase): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[IAP] Validating receipt with backend...');
      
      const receiptData = {
        receipt: purchase.transactionReceipt,
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        platform: Platform.OS,
        ...(Platform.OS === 'android' && {
          purchaseToken: (purchase as any).purchaseToken,
          packageName: (purchase as any).packageNameAndroid,
        }),
      };

      const response = await apiService.validateReceipt(receiptData);
      
      if (response.success) {
        console.log('[IAP] Receipt validation successful');
        return { success: true };
      } else {
        console.error('[IAP] Receipt validation failed:', response.error);
        return { success: false, error: response.error };
      }
    } catch (error: any) {
      console.error('[IAP] Receipt validation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle purchase updates
   */
  private async handlePurchaseUpdate(purchase: Purchase) {
    console.log('[IAP] Handling purchase update:', purchase.productId);
    
    try {
      // Validate with backend
      await this.validateReceiptWithBackend(purchase);
      
      // Show success message
      Alert.alert(
        'Purchase Successful',
        'Your subscription has been activated!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[IAP] Failed to handle purchase update:', error);
    }
  }

  /**
   * Handle purchase errors
   */
  private handlePurchaseError(error: PurchaseError) {
    console.warn('[IAP] Purchase error:', error);
    
    // Don't show alert for user cancellation
    if (error.code === 'E_USER_CANCELLED') {
      return;
    }

    Alert.alert(
      'Purchase Failed',
      error.message || 'Unable to complete purchase. Please try again.',
      [{ text: 'OK' }]
    );
  }

  /**
   * Check if feature is available for current subscription
   */
  async hasAccessToFeature(featureId: string): Promise<boolean> {
    const status = await this.getSubscriptionStatus();
    
    // Define feature access levels
    const proFeatures = ['advanced_insights', 'goal_tracking', 'calendar_sync'];
    const premiumFeatures = [...proFeatures, 'ai_coaching', 'unlimited_storage', 'priority_support'];

    if (status.isPremium) {
      return true; // Premium has access to everything
    }
    
    if (status.isPro) {
      return !premiumFeatures.includes(featureId) || proFeatures.includes(featureId);
    }
    
    // Free users have no access to premium features
    return false;
  }

  /**
   * Clean up listeners
   */
  async dispose() {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
    }
    
    try {
      if (RNIap) {
        await RNIap.endConnection();
      }
    } catch (error) {
      console.error('[IAP] Error ending connection:', error);
    }
  }
}

// Export singleton instance
export const nativeSubscriptionService = new NativeSubscriptionService();
export default nativeSubscriptionService;