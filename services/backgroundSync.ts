import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appleHealthKitService } from './appleHealthKit';
import { apiService } from './api';

interface BackgroundSyncService {
  initializeBackgroundSync(): Promise<void>;
  scheduleHealthKitSync(): Promise<void>;
  performBackgroundSync(): Promise<void>;
  getLastBackgroundSync(): Promise<Date | null>;
  setLastBackgroundSync(date: Date): Promise<void>;
}

class BackgroundSyncServiceImpl implements BackgroundSyncService {
  private isInitialized = false;
  private syncInterval: NodeJS.Timeout | null = null;

  async initializeBackgroundSync(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Only initialize on iOS and if HealthKit is available
      if (Platform.OS === 'ios' && appleHealthKitService.isHealthKitAvailable()) {
        await this.scheduleHealthKitSync();
        this.isInitialized = true;
        console.log('[BackgroundSync] Background sync initialized');
      } else {
        console.log('[BackgroundSync] Background sync not available on this platform');
      }
    } catch (error) {
      console.error('[BackgroundSync] Failed to initialize background sync:', error);
    }
  }

  async scheduleHealthKitSync(): Promise<void> {
    // Clear existing interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Schedule sync every 6 hours
    this.syncInterval = setInterval(async () => {
      await this.performBackgroundSync();
    }, 6 * 60 * 60 * 1000); // 6 hours

    // Perform initial sync
    await this.performBackgroundSync();
  }

  async performBackgroundSync(): Promise<void> {
    try {
      console.log('[BackgroundSync] Starting background sync...');

      // Check if HealthKit permissions are granted
      const hasPermission = await appleHealthKitService.isPermissionGranted();
      if (!hasPermission) {
        console.log('[BackgroundSync] HealthKit permissions not granted, skipping sync');
        return;
      }

      // Get last sync time
      const lastSync = await this.getLastBackgroundSync();
      const now = new Date();
      
      // Don't sync if we synced less than 4 hours ago
      if (lastSync && (now.getTime() - lastSync.getTime()) < 4 * 60 * 60 * 1000) {
        console.log('[BackgroundSync] Skipping sync - too recent');
        return;
      }

      // Sync recent sleep data
      const sleepData = await appleHealthKitService.syncRecentSleepData();
      
      if (sleepData.length > 0) {
        console.log(`[BackgroundSync] Synced ${sleepData.length} sleep sessions`);

        // Save each sleep session to the backend
        for (const session of sleepData) {
          try {
            await apiService.createSleepLog(
              session.startDate,
              session.endDate,
              session.sleepQuality,
              `Auto-synced from HealthKit - Efficiency: ${session.efficiency}%`,
            );
          } catch (error) {
            console.error('[BackgroundSync] Failed to save sleep session:', error);
          }
        }

        // Update last sync time
        await this.setLastBackgroundSync(now);
        console.log('[BackgroundSync] Background sync completed successfully');
      } else {
        console.log('[BackgroundSync] No new sleep data to sync');
      }
    } catch (error) {
      console.error('[BackgroundSync] Background sync failed:', error);
    }
  }

  async getLastBackgroundSync(): Promise<Date | null> {
    try {
      const dateString = await AsyncStorage.getItem('background_sync_last');
      return dateString ? new Date(dateString) : null;
    } catch (error) {
      console.error('[BackgroundSync] Error getting last background sync:', error);
      return null;
    }
  }

  async setLastBackgroundSync(date: Date): Promise<void> {
    try {
      await AsyncStorage.setItem('background_sync_last', date.toISOString());
    } catch (error) {
      console.error('[BackgroundSync] Error setting last background sync:', error);
    }
  }

  // Method to stop background sync (useful when user disables HealthKit)
  stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isInitialized = false;
    console.log('[BackgroundSync] Background sync stopped');
  }

  // Method to manually trigger sync (useful for testing or user-initiated sync)
  async manualSync(): Promise<boolean> {
    try {
      await this.performBackgroundSync();
      return true;
    } catch (error) {
      console.error('[BackgroundSync] Manual sync failed:', error);
      return false;
    }
  }

  // Method to check sync status
  async getSyncStatus(): Promise<{
    isEnabled: boolean;
    lastSync: Date | null;
    nextSyncIn: number | null; // minutes until next sync
  }> {
    const lastSync = await this.getLastBackgroundSync();
    const isEnabled = this.isInitialized && Platform.OS === 'ios';
    
    let nextSyncIn: number | null = null;
    if (isEnabled && lastSync) {
      const nextSyncTime = new Date(lastSync.getTime() + 6 * 60 * 60 * 1000); // 6 hours after last sync
      const now = new Date();
      nextSyncIn = Math.max(0, Math.floor((nextSyncTime.getTime() - now.getTime()) / (1000 * 60)));
    }

    return {
      isEnabled,
      lastSync,
      nextSyncIn,
    };
  }
}

// Export singleton instance
export const backgroundSyncService: BackgroundSyncService = new BackgroundSyncServiceImpl();

// Auto-initialize when the module is imported (only on iOS)
if (Platform.OS === 'ios') {
  // Use a small delay to ensure other services are initialized first
  setTimeout(() => {
    backgroundSyncService.initializeBackgroundSync().catch(error => {
      console.error('[BackgroundSync] Auto-initialization failed:', error);
    });
  }, 1000);
}