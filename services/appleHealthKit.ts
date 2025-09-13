import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Try different import methods
let AppleHealthKit: any = null;
try {
  AppleHealthKit = require('react-native-health');
} catch (error) {
  console.log('[HealthKit] react-native-health not available:', error);
}

// Alternative import method
if (!AppleHealthKit) {
  try {
    AppleHealthKit = require('react-native-health').default;
  } catch (error) {
    console.log('[HealthKit] react-native-health default not available:', error);
  }
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

interface ProcessedSleepData {
  startDate: string;
  endDate: string;
  duration: number; // in hours
  sleepStages: SleepStages;
  sleepQuality: number; // calculated score 1-10
  efficiency: number; // sleep efficiency percentage
  heartRateData: HeartRateData[];
}

interface SleepStages {
  deep: number; // minutes
  light: number; // minutes
  rem: number; // minutes
  awake: number; // minutes
}

interface HeartRateData {
  value: number;
  timestamp: string;
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

class AppleHealthKitServiceImpl implements AppleHealthKitService {
  private isInitialized = false;
  private hasPermissions = false;
  private readonly LAST_SYNC_KEY = 'healthkit_last_sync';

  async initHealthKit(): Promise<boolean> {
    try {
      if (!this.isHealthKitAvailable()) {
        console.log('[HealthKit] HealthKit not available on this device');
        return false;
      }

      if (!AppleHealthKit) {
        console.log('[HealthKit] react-native-health module not available');
        return false;
      }

      console.log('[HealthKit] Initializing HealthKit...');
      console.log('[HealthKit] AppleHealthKit object:', AppleHealthKit);
      console.log('[HealthKit] Available methods:', Object.keys(AppleHealthKit));
      
      // Check if initHealthKit exists
      if (typeof AppleHealthKit.initHealthKit !== 'function') {
        console.log('[HealthKit] initHealthKit is not a function');
        console.log('[HealthKit] initHealthKit type:', typeof AppleHealthKit.initHealthKit);
        return false;
      }

      // Request permissions using the correct API
      const permissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.SleepAnalysis,
            AppleHealthKit.Constants.Permissions.HeartRate,
            AppleHealthKit.Constants.Permissions.StepCount,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.RestingHeartRate,
            AppleHealthKit.Constants.Permissions.HeartRateVariability,
            AppleHealthKit.Constants.Permissions.OxygenSaturation,
            AppleHealthKit.Constants.Permissions.BodyMass,
            AppleHealthKit.Constants.Permissions.BodyFatPercentage,
            AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
            AppleHealthKit.Constants.Permissions.FlightsClimbed
          ],
          write: [
            AppleHealthKit.Constants.Permissions.SleepAnalysis,
            AppleHealthKit.Constants.Permissions.BodyMass,
            AppleHealthKit.Constants.Permissions.BodyFatPercentage
          ]
        }
      };

      return new Promise((resolve) => {
        AppleHealthKit.initHealthKit(permissions, (error: string) => {
          if (error) {
            console.log('[HealthKit] Error initializing HealthKit:', error);
            this.isInitialized = false;
            this.hasPermissions = false;
            resolve(false);
          } else {
            console.log('[HealthKit] HealthKit permissions granted successfully');
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

      console.log('[HealthKit] Fetching sleep data from', startDate.toISOString(), 'to', endDate.toISOString());

      return new Promise((resolve) => {
        const options = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        };

        AppleHealthKit.getSleepSamples(options, (error: string, results: any[]) => {
          if (error) {
            console.error('[HealthKit] Error getting sleep data:', error);
            resolve([]);
          } else {
            console.log('[HealthKit] Raw sleep data:', results);
            this.processSleepSamples(results, startDate, endDate).then(resolve);
          }
        });
      });
    } catch (error) {
      console.error('[HealthKit] Exception in getSleepData:', error);
      return [];
    }
  }

  private async processSleepSamples(
    samples: any[], 
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

  private groupSleepSamplesByNight(samples: any[]): Map<string, any[]> {
    const sessions = new Map<string, any[]>();

    samples.forEach(sample => {
      const sleepDate = new Date(sample.startDate);
      // If sleep starts after 6 PM, consider it the next day's sleep
      const nightKey = sleepDate.getHours() >= 18 
        ? new Date(sleepDate.getTime() + 24 * 60 * 60 * 1000).toDateString()
        : sleepDate.toDateString();
      
      if (!sessions.has(nightKey)) {
        sessions.set(nightKey, []);
      }
      sessions.get(nightKey)!.push(sample);
    });

    return sessions;
  }

  private calculateSleepStages(samples: any[]): SleepStages {
    const stages: SleepStages = { deep: 0, light: 0, rem: 0, awake: 0 };

    samples.forEach(sample => {
      const duration = (new Date(sample.endDate).getTime() - new Date(sample.startDate).getTime()) / (1000 * 60); // minutes
      
      switch (sample.value) {
        case 'DEEP':
        case 'Core':
          stages.deep += duration;
          break;
        case 'LIGHT':
        case 'REM':
          stages.light += duration;
          break;
        case 'AWAKE':
        case 'Awake':
          stages.awake += duration;
          break;
        default:
          stages.light += duration;
      }
    });

    return stages;
  }

  private calculateSleepEfficiency(stages: SleepStages): number {
    const totalSleep = stages.deep + stages.light + stages.rem;
    const totalTime = totalSleep + stages.awake;
    return totalTime > 0 ? Math.round((totalSleep / totalTime) * 100) : 0;
  }

  private calculateSleepQuality(stages: SleepStages, efficiency: number, duration: number): number {
    // Base score from efficiency
    let score = efficiency / 10;
    
    // Bonus for good sleep duration (7-9 hours)
    if (duration >= 7 && duration <= 9) {
      score += 1;
    } else if (duration >= 6 && duration <= 10) {
      score += 0.5;
    }
    
    // Bonus for good deep sleep ratio (15-25%)
    const totalSleep = stages.deep + stages.light + stages.rem;
    const deepSleepRatio = totalSleep > 0 ? (stages.deep / totalSleep) * 100 : 0;
    if (deepSleepRatio >= 15 && deepSleepRatio <= 25) {
      score += 1;
    }
    
    return Math.min(10, Math.max(1, Math.round(score)));
  }

  async getHeartRateData(startDate: Date, endDate: Date): Promise<HeartRateData[]> {
    try {
      if (!this.hasPermissions) {
        return [];
      }

      return new Promise((resolve) => {
        const options = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        };

        AppleHealthKit.getHeartRateSamples(options, (error: string, results: any[]) => {
          if (error) {
            console.error('[HealthKit] Error getting heart rate data:', error);
            resolve([]);
          } else {
            const heartRateData = results.map((sample: any) => ({
              value: sample.value,
              timestamp: sample.startDate,
            }));
            resolve(heartRateData);
          }
        });
      });
    } catch (error) {
      console.error('[HealthKit] Error getting heart rate data:', error);
      return [];
    }
  }

  async requestPermissions(): Promise<boolean> {
    return this.initHealthKit();
  }

  isHealthKitAvailable(): boolean {
    return Platform.OS === 'ios';
  }

  async writeSleepData(startDate: Date, endDate: Date): Promise<boolean> {
    try {
      if (!this.hasPermissions) {
        console.log('[HealthKit] No permissions to write sleep data');
        return false;
      }

      const sleepData = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        value: 'IN_BED',
      };

      return new Promise((resolve) => {
        AppleHealthKit.saveSleepSample(sleepData, (error: string) => {
          if (error) {
            console.error('[HealthKit] Error writing sleep data:', error);
            resolve(false);
          } else {
            console.log('[HealthKit] Sleep data written successfully');
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error('[HealthKit] Error writing sleep data:', error);
      return false;
    }
  }

  async getLastSyncDate(): Promise<Date | null> {
    try {
      const lastSync = await AsyncStorage.getItem(this.LAST_SYNC_KEY);
      return lastSync ? new Date(lastSync) : null;
    } catch (error) {
      console.error('[HealthKit] Error getting last sync date:', error);
      return null;
    }
  }

  async setLastSyncDate(date: Date): Promise<void> {
    try {
      await AsyncStorage.setItem(this.LAST_SYNC_KEY, date.toISOString());
    } catch (error) {
      console.error('[HealthKit] Error setting last sync date:', error);
    }
  }

  async syncRecentSleepData(): Promise<ProcessedSleepData[]> {
    try {
      const lastSync = await this.getLastSyncDate();
      const endDate = new Date();
      const startDate = lastSync || new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

      console.log('[HealthKit] Syncing sleep data from', startDate.toISOString(), 'to', endDate.toISOString());

      const sleepData = await this.getSleepData(startDate, endDate);
      
      if (sleepData.length > 0) {
        await this.setLastSyncDate(endDate);
      }

      return sleepData;
    } catch (error) {
      console.error('[HealthKit] Error syncing recent sleep data:', error);
      return [];
    }
  }

  async isPermissionGranted(): Promise<boolean> {
    try {
      if (!this.isHealthKitAvailable()) {
        return false;
      }

      return new Promise((resolve) => {
        AppleHealthKit.authorizationStatusForType(
          AppleHealthKit.Constants.Permissions.SleepAnalysis,
          (error: string, result: any) => {
            if (error) {
              console.error('[HealthKit] Error checking permission status:', error);
              resolve(false);
            } else {
              resolve(result === AppleHealthKit.Constants.AuthorizationStatus.Authorized);
            }
          }
        );
      });
    } catch (error) {
      console.error('[HealthKit] Error checking permission status:', error);
      return false;
    }
  }
}

export const appleHealthKitService = new AppleHealthKitServiceImpl();
export default appleHealthKitService;