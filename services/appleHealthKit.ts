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

      console.log('[HealthKit] Initializing HealthKit...');
      
      const permissions: HealthKitPermissions = {
        permissions: {
          read: [
            'SleepAnalysis',
            'HeartRate',
            'Steps',
            'ActiveEnergyBurned'
          ],
          write: [
            'SleepAnalysis'
          ]
        }
      };

      return new Promise((resolve) => {
        initHealthKit(permissions, (error: string, result: any) => {
          if (error) {
            console.error('[HealthKit] Error initializing HealthKit:', error);
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

  private calculateSleepStages(samples: SleepSample[]): SleepStages {
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

      return new Promise((resolve, reject) => {
        const options = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        };

        getHeartRateSamples(options, (err: Object, results: HeartRateSample[]) => {
          if (err) {
            console.error('[HealthKit] Error getting heart rate data:', err);
            resolve([]);
            return;
          }

          const heartRateData = results.map(sample => ({
            value: sample.value,
            timestamp: sample.startDate,
          }));

          resolve(heartRateData);
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

      return new Promise((resolve) => {
        const sleepData = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          value: 'IN_BED',
        };

        saveSleepSample(sleepData, (err: Object, result: any) => {
          if (err) {
            console.error('[HealthKit] Error writing sleep data:', err);
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
        getAuthStatus('SleepAnalysis', (err: Object, result: any) => {
          if (err) {
            console.error('[HealthKit] Error checking permission status:', err);
            resolve(false);
          } else {
            resolve(result === 'authorized');
          }
        });
      });
    } catch (error) {
      console.error('[HealthKit] Error checking permission status:', error);
      return false;
    }
  }
}

export const appleHealthKitService = new AppleHealthKitServiceImpl();
export default appleHealthKitService;