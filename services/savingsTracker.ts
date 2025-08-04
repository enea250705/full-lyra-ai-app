import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApi } from '../hooks/useApi';

interface RealSavingsEvent {
  amount: number;
  reason: string;
  category: 'food' | 'shopping' | 'entertainment' | 'transport' | 'subscription' | 'other';
  originalAmount: number;
  triggerType: 'mood_alert' | 'location_alert' | 'ai_suggestion' | 'manual' | 'time_based' | 'weather_based';
  metadata?: Record<string, any>;
}

class SavingsTracker {
  private apiRequest: any = null;

  constructor() {
    // Initialize API request function
    this.initializeApi();
  }

  private async initializeApi() {
    // We'll set this up when the service is used
  }

  setApiRequest(apiRequest: any) {
    this.apiRequest = apiRequest;
  }

  /**
   * Track savings when user follows mood-based intervention
   */
  async trackMoodInterventionSaving(params: {
    mood: string;
    originalSpendingIntent: number;
    actualSpent: number;
    category: string;
    location?: string;
    interventionMessage?: string;
  }) {
    const savedAmount = params.originalSpendingIntent - params.actualSpent;
    
    if (savedAmount <= 0) {
      return; // No savings to record
    }

    const savingsEvent: RealSavingsEvent = {
      amount: params.actualSpent,
      reason: `Avoided overspending due to ${params.mood} mood alert${params.interventionMessage ? ': ' + params.interventionMessage : ''}`,
      category: this.categorizeSpending(params.category),
      originalAmount: params.originalSpendingIntent,
      triggerType: 'mood_alert',
      metadata: {
        mood: params.mood,
        location: params.location,
        interventionMessage: params.interventionMessage,
        timestamp: new Date().toISOString(),
      },
    };

    return this.recordSaving(savingsEvent);
  }

  /**
   * Track savings when user avoids expensive stores
   */
  async trackLocationInterventionSaving(params: {
    storeName: string;
    storeType: string;
    averageSpending: number;
    actualSpent: number;
    location: { latitude: number; longitude: number };
  }) {
    const savedAmount = params.averageSpending - params.actualSpent;
    
    if (savedAmount <= 0) {
      return; // No savings to record
    }

    const savingsEvent: RealSavingsEvent = {
      amount: params.actualSpent,
      reason: `Avoided overspending at ${params.storeName} due to location alert`,
      category: this.categorizeStoreType(params.storeType),
      originalAmount: params.averageSpending,
      triggerType: 'location_alert',
      metadata: {
        storeName: params.storeName,
        storeType: params.storeType,
        location: params.location,
        timestamp: new Date().toISOString(),
      },
    };

    return this.recordSaving(savingsEvent);
  }

  /**
   * Track savings from AI-powered suggestions
   */
  async trackAIRecommendationSaving(params: {
    recommendation: string;
    category: string;
    originalAmount: number;
    actualAmount: number;
    context?: Record<string, any>;
  }) {
    const savedAmount = params.originalAmount - params.actualAmount;
    
    if (savedAmount <= 0) {
      return; // No savings to record
    }

    const savingsEvent: RealSavingsEvent = {
      amount: params.actualAmount,
      reason: `Followed AI recommendation: ${params.recommendation}`,
      category: this.categorizeSpending(params.category),
      originalAmount: params.originalAmount,
      triggerType: 'ai_suggestion',
      metadata: {
        recommendation: params.recommendation,
        context: params.context,
        timestamp: new Date().toISOString(),
      },
    };

    return this.recordSaving(savingsEvent);
  }

  /**
   * Track manual savings reported by user
   */
  async trackManualSaving(params: {
    description: string;
    category: string;
    originalAmount: number;
    actualAmount: number;
  }) {
    const savedAmount = params.originalAmount - params.actualAmount;
    
    if (savedAmount <= 0) {
      return; // No savings to record
    }

    const savingsEvent: RealSavingsEvent = {
      amount: params.actualAmount,
      reason: params.description,
      category: this.categorizeSpending(params.category),
      originalAmount: params.originalAmount,
      triggerType: 'manual',
      metadata: {
        userReported: true,
        timestamp: new Date().toISOString(),
      },
    };

    return this.recordSaving(savingsEvent);
  }

  /**
   * Track weather-based intervention savings
   */
  async trackWeatherInterventionSaving(params: {
    weather: string;
    mood: string;
    originalAmount: number;
    actualAmount: number;
    category: string;
    recommendation?: string;
  }) {
    const savedAmount = params.originalAmount - params.actualAmount;
    
    if (savedAmount <= 0) {
      return; // No savings to record
    }

    const savingsEvent: RealSavingsEvent = {
      amount: params.actualAmount,
      reason: `Weather-mood intervention (${params.weather} weather affecting ${params.mood} mood)${params.recommendation ? ': ' + params.recommendation : ''}`,
      category: this.categorizeSpending(params.category),
      originalAmount: params.originalAmount,
      triggerType: 'weather_based',
      metadata: {
        weather: params.weather,
        mood: params.mood,
        recommendation: params.recommendation,
        timestamp: new Date().toISOString(),
      },
    };

    return this.recordSaving(savingsEvent);
  }

  /**
   * Record the saving to the backend
   */
  private async recordSaving(savingsEvent: RealSavingsEvent) {
    if (!this.apiRequest) {
      console.warn('SavingsTracker: API not initialized yet');
      // Store locally for later sync
      await this.storeLocalSaving(savingsEvent);
      return null;
    }

    try {
      const response = await this.apiRequest('/savings/record', {
        method: 'POST',
        body: JSON.stringify(savingsEvent),
      });

      if (response.success) {
        console.log('Savings recorded successfully:', response.data);
        return response.data;
      } else {
        console.error('Failed to record savings:', response.error);
        // Store locally as backup
        await this.storeLocalSaving(savingsEvent);
        return null;
      }
    } catch (error) {
      console.error('Error recording savings:', error);
      // Store locally as backup
      await this.storeLocalSaving(savingsEvent);
      return null;
    }
  }

  /**
   * Store savings locally when API is not available
   */
  private async storeLocalSaving(savingsEvent: RealSavingsEvent) {
    try {
      const existingSavings = await AsyncStorage.getItem('pendingSavings');
      const savings = existingSavings ? JSON.parse(existingSavings) : [];
      
      savings.push({
        ...savingsEvent,
        localTimestamp: new Date().toISOString(),
        synced: false,
      });

      await AsyncStorage.setItem('pendingSavings', JSON.stringify(savings));
    } catch (error) {
      console.error('Error storing local savings:', error);
    }
  }

  /**
   * Sync locally stored savings when API becomes available
   */
  async syncLocalSavings() {
    if (!this.apiRequest) {
      return;
    }

    try {
      const existingSavings = await AsyncStorage.getItem('pendingSavings');
      if (!existingSavings) {
        return;
      }

      const savings = JSON.parse(existingSavings);
      const unsyncedSavings = savings.filter((s: any) => !s.synced);

      for (const saving of unsyncedSavings) {
        const { localTimestamp, synced, ...savingData } = saving;
        
        try {
          const response = await this.apiRequest('/savings/record', {
            method: 'POST',
            body: JSON.stringify(savingData),
          });

          if (response.success) {
            // Mark as synced
            saving.synced = true;
          }
        } catch (error) {
          console.error('Error syncing saving:', error);
        }
      }

      // Update local storage
      await AsyncStorage.setItem('pendingSavings', JSON.stringify(savings));
      
      // Clean up synced savings older than 7 days
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentSavings = savings.filter((s: any) => 
        !s.synced || new Date(s.localTimestamp) > weekAgo
      );
      
      await AsyncStorage.setItem('pendingSavings', JSON.stringify(recentSavings));
    } catch (error) {
      console.error('Error syncing local savings:', error);
    }
  }

  private categorizeSpending(category: string): RealSavingsEvent['category'] {
    const lowerCategory = category.toLowerCase();
    
    if (lowerCategory.includes('food') || lowerCategory.includes('coffee') || lowerCategory.includes('restaurant')) {
      return 'food';
    } else if (lowerCategory.includes('shop') || lowerCategory.includes('retail') || lowerCategory.includes('clothes')) {
      return 'shopping';
    } else if (lowerCategory.includes('entertainment') || lowerCategory.includes('movie') || lowerCategory.includes('gym')) {
      return 'entertainment';
    } else if (lowerCategory.includes('transport') || lowerCategory.includes('uber') || lowerCategory.includes('taxi')) {
      return 'transport';
    } else if (lowerCategory.includes('subscription') || lowerCategory.includes('service')) {
      return 'subscription';
    } else {
      return 'other';
    }
  }

  private categorizeStoreType(storeType: string): RealSavingsEvent['category'] {
    const lowerType = storeType.toLowerCase();
    
    if (lowerType.includes('restaurant') || lowerType.includes('cafe') || lowerType.includes('food')) {
      return 'food';
    } else if (lowerType.includes('retail') || lowerType.includes('shop') || lowerType.includes('store')) {
      return 'shopping';
    } else if (lowerType.includes('entertainment') || lowerType.includes('gym') || lowerType.includes('bar')) {
      return 'entertainment';
    } else {
      return 'other';
    }
  }
}

export default new SavingsTracker();