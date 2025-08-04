import { 
  initHealthKit,
  getSleepSamples,
  getHeartRateSamples,
  saveSleepSample,
  getAuthStatus,
  isAvailable,
  Constants
} from 'react-native-health';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface HealthKitPermissions {
  permissions: {
    read: string[];
    write: string[];
  };
}

interface SleepSample {
  value: string;
  startDate: string;
  endDate: string;
}

interface HeartRateSample {
  value: number;
  startDate: string;
  endDate: string;
}

interface AppleHealthKitService {
  initHealthKit(): Promise<boolean>;
  getSleepData(startDate: Date, endDate: Date): Promise<ProcessedSleepData[]>;
  getHeartRateData(startDate: Date, endDate: Date): Promise<HeartRateData[]>;
  requestPermissions(): Promise<boolean>;
  isHealthKitAvailable(): boolean;
  writeSleepData(startDate: Date, endDate: Date): Promise<boolean>;
  getLastSyncDate(): Promise<Date | null>;
  setLastSyncDate(date: Date): Promise<void>;
  syncRecentSleepData(): Promise<ProcessedSleepData[]>;
  isPermissionGranted(): Promise<boolean>;
}

interface ProcessedSleepData {
  startDate: string;
  endDate: string;
  duration: number; // in hours
  sleepStages: SleepStages;
  sleepQuality: number; // calculated score 1-10
  efficiency: number; // percentage
  heartRateData?: HeartRateData[];
}

interface SleepStages {
  inBed: number; // minutes
  asleep: number; // minutes
  awake: number; // minutes
  deepSleep?: number; // minutes (if available)
  lightSleep?: number; // minutes (if available)
  remSleep?: number; // minutes (if available)
}

interface HeartRateData {
  value: number;
  startDate: string;
  endDate: string;
}

const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      Constants.Permissions.SleepAnalysis,
      Constants.Permissions.HeartRate,
      Constants.Permissions.RestingHeartRate,
      Constants.Permissions.HeartRateVariability,
      Constants.Permissions.OxygenSaturation,
    ],
    write: [
      Constants.Permissions.SleepAnalysis,
    ],
  },
};

class AppleHealthKitServiceImpl implements AppleHealthKitService {
  private isInitialized = false;
  private hasPermissions = false;

  async initHealthKit(): Promise<boolean> {
    try {
      if (!this.isHealthKitAvailable()) {
        console.log('[HealthKit] Not available on this device');
        return false;
      }

      return new Promise((resolve) => {
        initHealthKit(permissions, (error: string) => {
          if (error) {
            console.log('[HealthKit] Cannot grant permissions:', error);
            this.isInitialized = false;
            this.hasPermissions = false;
            resolve(false);
          } else {
            console.log('[HealthKit] Permissions granted successfully');
            this.isInitialized = true;
            this.hasPermissions = true;
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error('[HealthKit] Exception in initHealthKit:', error);
      this.isInitialized = false;
      this.hasPermissions = false;
      return false;
    }
  }

  async getSleepData(startDate: Date, endDate: Date): Promise<ProcessedSleepData[]> {
    try {
      if (!this.hasPermissions) {
        console.log('[HealthKit] Permissions not granted, returning empty sleep data');
        return [];
      }

      if (!this.isHealthKitAvailable()) {
        console.log('[HealthKit] HealthKit not available, returning empty sleep data');
        return [];
      }

      return new Promise((resolve, reject) => {
        const options = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        };

        getSleepSamples(options, async (err: Object, results: SleepSample[]) => {
          if (err) {
            console.error('[HealthKit] Error getting sleep data:', err);
            resolve([]);
            return;
          }

          try {
            const processedData = await this.processSleepSamples(results, startDate, endDate);
            resolve(processedData);
          } catch (error) {
            console.error('[HealthKit] Error processing sleep data:', error);
            resolve([]);
          }
        });
      });
    } catch (error) {
      console.error('[HealthKit] Exception in getSleepData:', error);
      return [];
    }
  }

  private async processSleepSamples(
    samples: SleepSample[], 
    startDate: Date, 
    endDate: Date
  ): Promise<ProcessedSleepData[]> {
    // Group samples by date
    const sleepSessions = this.groupSleepSamplesByNight(samples);
    const processedSessions: ProcessedSleepData[] = [];

    for (const [dateKey, nightSamples] of sleepSessions) {
      try {
        const sleepStages = this.calculateSleepStages(nightSamples);
        const sessionStart = new Date(Math.min(...nightSamples.map(s => new Date(s.startDate).getTime())));
        const sessionEnd = new Date(Math.max(...nightSamples.map(s => new Date(s.endDate).getTime())));
        
        const duration = (sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60 * 60); // hours
        const efficiency = this.calculateSleepEfficiency(sleepStages);
        const quality = this.calculateSleepQuality(sleepStages, efficiency, duration);

        // Get heart rate data for this sleep session
        const heartRateData = await this.getHeartRateData(sessionStart, sessionEnd);

        processedSessions.push({
          startDate: sessionStart.toISOString(),
          endDate: sessionEnd.toISOString(),
          duration: Math.round(duration * 100) / 100,
          sleepStages,
          sleepQuality: quality,
          efficiency,
          heartRateData,
        });
      } catch (error) {
        console.error('[HealthKit] Error processing sleep session:', error);
      }
    }

    return processedSessions.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }

  private groupSleepSamplesByNight(samples: SleepSample[]): Map<string, SleepSample[]> {
    const sessions = new Map<string, SleepSample[]>();

    samples.forEach(sample => {
      const sleepDate = new Date(sample.startDate);
      // If sleep starts after 6 PM, consider it the next day's sleep
      if (sleepDate.getHours() >= 18) {
        sleepDate.setDate(sleepDate.getDate() + 1);
      }
      const dateKey = sleepDate.toISOString().split('T')[0];

      if (!sessions.has(dateKey)) {
        sessions.set(dateKey, []);
      }
      sessions.get(dateKey)!.push(sample);
    });

    return sessions;
  }

  private calculateSleepStages(samples: SleepSample[]): SleepStages {
    const stages: SleepStages = {
      inBed: 0,
      asleep: 0,
      awake: 0,
    };

    samples.forEach(sample => {
      const duration = (new Date(sample.endDate).getTime() - new Date(sample.startDate).getTime()) / (1000 * 60); // minutes

      switch (sample.value) {
        case 'INBED':
          stages.inBed += duration;
          break;
        case 'ASLEEP':
          stages.asleep += duration;
          break;
        case 'AWAKE':
          stages.awake += duration;
          break;
        case 'DEEP':
          stages.deepSleep = (stages.deepSleep || 0) + duration;
          stages.asleep += duration;
          break;
        case 'REM':
          stages.remSleep = (stages.remSleep || 0) + duration;
          stages.asleep += duration;
          break;
        case 'LIGHT':
          stages.lightSleep = (stages.lightSleep || 0) + duration;
          stages.asleep += duration;
          break;
      }
    });

    return stages;
  }

  private calculateSleepEfficiency(stages: SleepStages): number {
    const totalTime = stages.inBed || (stages.asleep + stages.awake);
    if (totalTime === 0) return 0;
    
    return Math.round((stages.asleep / totalTime) * 100);
  }

  private calculateSleepQuality(stages: SleepStages, efficiency: number, duration: number): number {
    let quality = 5; // Base quality

    // Duration factor (7-9 hours is optimal)
    if (duration >= 7 && duration <= 9) {
      quality += 1;
    } else if (duration < 6 || duration > 10) {
      quality -= 1;
    }

    // Efficiency factor
    if (efficiency >= 85) {
      quality += 2;
    } else if (efficiency >= 75) {
      quality += 1;
    } else if (efficiency < 65) {
      quality -= 1;
    }

    // Deep sleep factor (if available)
    if (stages.deepSleep) {
      const deepSleepPercent = (stages.deepSleep / stages.asleep) * 100;
      if (deepSleepPercent >= 20 && deepSleepPercent <= 25) {
        quality += 1;
      } else if (deepSleepPercent < 15) {
        quality -= 1;
      }
    }

    // REM sleep factor (if available)
    if (stages.remSleep) {
      const remPercent = (stages.remSleep / stages.asleep) * 100;
      if (remPercent >= 20 && remPercent <= 25) {
        quality += 1;
      } else if (remPercent < 15) {
        quality -= 1;
      }
    }

    return Math.max(1, Math.min(10, quality));
  }

  async getHeartRateData(startDate: Date, endDate: Date): Promise<HeartRateData[]> {
    try {
      if (!this.hasPermissions) {
        return [];
      }

      if (!this.isHealthKitAvailable()) {
        console.log('[HealthKit] HealthKit not available, returning empty heart rate data');
        return [];
      }

      return new Promise((resolve) => {
        const options = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: 1000, // Limit to avoid too much data
        };

        getHeartRateSamples(options, (err: Object, results: HeartRateSample[]) => {
          if (err) {
            console.error('[HealthKit] Error getting heart rate data:', err);
            resolve([]);
            return;
          }

          const heartRateData: HeartRateData[] = results.map(sample => ({
            value: sample.value,
            startDate: sample.startDate,
            endDate: sample.endDate,
          }));

          resolve(heartRateData);
        });
      });
    } catch (error) {
      console.error('[HealthKit] Exception in getHeartRateData:', error);
      return [];
    }
  }

  async requestPermissions(): Promise<boolean> {
    return this.initHealthKit();
  }

  isHealthKitAvailable(): boolean {
    try {
      return Platform.OS === 'ios' && typeof isAvailable === 'function' && isAvailable();
    } catch (error) {
      console.warn('[HealthKit] isAvailable check failed:', error);
      return false;
    }
  }

  async writeSleepData(startDate: Date, endDate: Date): Promise<boolean> {
    if (!this.hasPermissions) {
      return false;
    }

    return new Promise((resolve) => {
      const sleepData = {
        value: 'ASLEEP',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      saveSleepSample(sleepData, (err: Object) => {
        if (err) {
          console.error('[HealthKit] Error writing sleep data:', err);
          resolve(false);
        } else {
          console.log('[HealthKit] Sleep data written successfully');
          resolve(true);
        }
      });
    });
  }

  async getLastSyncDate(): Promise<Date | null> {
    try {
      const dateString = await AsyncStorage.getItem('healthkit_last_sync');
      return dateString ? new Date(dateString) : null;
    } catch (error) {
      console.error('[HealthKit] Error getting last sync date:', error);
      return null;
    }
  }

  async setLastSyncDate(date: Date): Promise<void> {
    try {
      await AsyncStorage.setItem('healthkit_last_sync', date.toISOString());
    } catch (error) {
      console.error('[HealthKit] Error setting last sync date:', error);
    }
  }

  async syncRecentSleepData(): Promise<ProcessedSleepData[]> {
    const lastSync = await this.getLastSyncDate();
    const endDate = new Date();
    const startDate = lastSync || new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago if no last sync

    try {
      const sleepData = await this.getSleepData(startDate, endDate);
      await this.setLastSyncDate(endDate);
      return sleepData;
    } catch (error) {
      console.error('[HealthKit] Error syncing recent sleep data:', error);
      return [];
    }
  }

  async isPermissionGranted(): Promise<boolean> {
    if (!this.isHealthKitAvailable()) {
      return false;
    }

    return new Promise((resolve) => {
      getAuthStatus(permissions, (err: Object, result: any) => {
        if (err) {
          resolve(false);
        } else {
          const sleepPermission = result[Constants.Permissions.SleepAnalysis];
          resolve(sleepPermission === Constants.AuthorizationStatusCodes.Granted);
        }
      });
    });
  }
}

// Export singleton instance
export const appleHealthKitService: AppleHealthKitService = new AppleHealthKitServiceImpl();

// Export types for use in other components
export type { ProcessedSleepData, SleepStages, HeartRateData };