import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { apiService } from '../services/api';
import { useWeatherMood } from './useWeatherMood';
import { appleHealthKitService, ProcessedSleepData } from '../services/appleHealthKit';

interface SleepLog {
  id: string;
  userId: string;
  startTime: string;
  endTime: string;
  duration: number;
  qualityRating: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface SleepStats {
  averageDuration: number;
  averageQuality: number;
  totalSessions: number;
  weeklyTrend: number;
  sleepEfficiency: number;
}

interface LocationAdjustedSleep {
  userId: string;
  timezone: string;
  bedtime: Date;
  wakeTime: Date;
  sleepDuration: number;
  sleepQuality: number;
  locationAdjusted: boolean;
}

interface SleepState {
  sleepLogs: SleepLog[];
  sleepStats: SleepStats | null;
  locationAdjustedSleep: LocationAdjustedSleep | null;
  healthKitData: ProcessedSleepData[];
  healthKitEnabled: boolean;
  healthKitAvailable: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useSleep = (userId?: string) => {
  const { adjustSleepForTimezone } = useWeatherMood(userId);
  const [state, setState] = useState<SleepState>({
    sleepLogs: [],
    sleepStats: null,
    locationAdjustedSleep: null,
    healthKitData: [],
    healthKitEnabled: false,
    healthKitAvailable: false, // Start with false, check safely in useEffect
    isLoading: false,
    error: null,
  });

  // Safely check HealthKit availability on mount
  useEffect(() => {
    try {
      const isAvailable = appleHealthKitService.isHealthKitAvailable();
      setState(prev => ({ ...prev, healthKitAvailable: isAvailable }));
    } catch (error) {
      console.warn('[useSleep] HealthKit availability check failed:', error);
      setState(prev => ({ ...prev, healthKitAvailable: false }));
    }
  }, []);

  const createSleepLog = async (
    startTime: string,
    endTime: string,
    qualityRating: number,
    notes?: string,
    adjustForLocation: boolean = true
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // If location adjustment is enabled, adjust sleep times for current timezone
      let adjustedStartTime = startTime;
      let adjustedEndTime = endTime;
      
      if (adjustForLocation && userId) {
        const locationAdjustedData = await adjustSleepForTimezone({
          bedtime: new Date(startTime),
          wakeTime: new Date(endTime),
          sleepQuality: qualityRating,
        });
        
        if (locationAdjustedData) {
          adjustedStartTime = locationAdjustedData.bedtime.toISOString();
          adjustedEndTime = locationAdjustedData.wakeTime.toISOString();
          
          setState(prev => ({
            ...prev,
            locationAdjustedSleep: locationAdjustedData,
          }));
        }
      }

      const response = await apiService.createSleepLog(
        adjustedStartTime,
        adjustedEndTime,
        qualityRating,
        notes
      );
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          sleepLogs: [response.data, ...prev.sleepLogs],
          isLoading: false,
        }));
        
        // Refresh stats after creating new log
        await getSleepStats();
        
        return response.data;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Failed to create sleep log',
        }));
        return null;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to create sleep log',
      }));
      return null;
    }
  };

  const getSleepLogs = async (
    page: number = 1,
    limit: number = 20,
    startDate?: string,
    endDate?: string
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiService.getSleepLogs(page, limit, startDate, endDate);
      
      if (response.success && response.data && response.data.data) {
        setState(prev => ({
          ...prev,
          sleepLogs: page === 1 ? response.data!.data : [...prev.sleepLogs, ...response.data!.data],
          isLoading: false,
        }));
        return response.data;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Failed to fetch sleep logs',
        }));
        return null;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch sleep logs',
      }));
      return null;
    }
  };

  const getSleepStats = async (period: string = 'week') => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiService.getSleepTrends(period);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          sleepStats: response.data,
          isLoading: false,
        }));
        return response.data;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Failed to fetch sleep stats',
        }));
        return null;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch sleep stats',
      }));
      return null;
    }
  };

  const adjustSleepForCurrentLocation = async (sleepData?: {
    bedtime?: Date;
    wakeTime?: Date;
    sleepQuality?: number;
  }) => {
    if (!userId) {
      setState(prev => ({
        ...prev,
        error: 'User ID is required for location adjustment',
      }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const locationAdjustedData = await adjustSleepForTimezone(sleepData);
      
      if (locationAdjustedData) {
        setState(prev => ({
          ...prev,
          locationAdjustedSleep: locationAdjustedData,
          isLoading: false,
        }));
        return locationAdjustedData;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to adjust sleep for location',
        }));
        return null;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to adjust sleep for location',
      }));
      return null;
    }
  };

  const getSleepRecommendations = () => {
    if (!state.sleepStats || !state.locationAdjustedSleep) return [];

    const recommendations: string[] = [];
    const { averageDuration, averageQuality } = state.sleepStats;
    const { sleepDuration, timezone } = state.locationAdjustedSleep;

    // Duration recommendations
    if (averageDuration < 6) {
      recommendations.push('🕐 Consider going to bed earlier to get more sleep');
    } else if (averageDuration > 9) {
      recommendations.push('⏰ You might be oversleeping - try waking up earlier');
    }

    // Quality recommendations
    if (averageQuality < 6) {
      recommendations.push('😴 Your sleep quality could improve - consider a consistent bedtime routine');
    }

    // Timezone recommendations
    if (timezone !== 'UTC') {
      recommendations.push(`🌍 Your sleep is adjusted for ${timezone} timezone`);
    }

    // Sleep consistency recommendations
    if (state.sleepLogs.length > 3) {
      const bedtimes = state.sleepLogs.slice(0, 7).map(log => 
        new Date(log.startTime).getHours()
      );
      const avgBedtime = bedtimes.reduce((sum, time) => sum + time, 0) / bedtimes.length;
      const variability = Math.sqrt(
        bedtimes.reduce((sum, time) => sum + Math.pow(time - avgBedtime, 2), 0) / bedtimes.length
      );
      
      if (variability > 2) {
        recommendations.push('📅 Try to maintain a consistent bedtime schedule');
      }
    }

    return recommendations;
  };

  // HealthKit Functions
  const enableHealthKitTracking = async (): Promise<boolean> => {
    try {
      if (!state.healthKitAvailable) {
        setState(prev => ({
          ...prev,
          error: 'HealthKit is not available on this device',
        }));
        return false;
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const hasPermission = await appleHealthKitService.requestPermissions();
      
      if (hasPermission) {
        setState(prev => ({
          ...prev,
          healthKitEnabled: true,
          isLoading: false,
        }));
        
        // Start initial sync
        await syncHealthKitData();
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'HealthKit permissions denied',
        }));
        return false;
      }
    } catch (error) {
      console.error('[useSleep] HealthKit enable error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to enable HealthKit tracking',
      }));
      return false;
    }
  };

  const syncHealthKitData = async (): Promise<void> => {
    if (!state.healthKitEnabled) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const healthKitData = await appleHealthKitService.syncRecentSleepData();
      
      setState(prev => ({
        ...prev,
        healthKitData,
        isLoading: false,
      }));

      // Save HealthKit data to backend
      for (const sleepSession of healthKitData) {
        await createSleepLog(
          sleepSession.startDate,
          sleepSession.endDate,
          sleepSession.sleepQuality,
          `Automatically tracked via HealthKit - Efficiency: ${sleepSession.efficiency}%`,
          false // Don't adjust for location since HealthKit data is already accurate
        );
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to sync HealthKit data',
      }));
    }
  };

  const getHealthKitSleepData = async (days: number = 7): Promise<ProcessedSleepData[]> => {
    if (!state.healthKitEnabled) {
      return [];
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const healthKitData = await appleHealthKitService.getSleepData(startDate, endDate);
      
      setState(prev => ({
        ...prev,
        healthKitData,
        isLoading: false,
      }));

      return healthKitData;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch HealthKit sleep data',
      }));
      return [];
    }
  };

  const checkHealthKitPermissions = async (): Promise<boolean> => {
    if (!state.healthKitAvailable) {
      return false;
    }

    try {
      const isGranted = await appleHealthKitService.isPermissionGranted();
      setState(prev => ({
        ...prev,
        healthKitEnabled: isGranted,
      }));
      return isGranted;
    } catch (error) {
      return false;
    }
  };

  const getEnhancedSleepRecommendations = () => {
    const baseRecommendations = getSleepRecommendations();
    
    if (state.healthKitData.length > 0) {
      const latestSession = state.healthKitData[0];
      
      // Add HealthKit-specific recommendations
      if (latestSession.efficiency < 80) {
        baseRecommendations.push('📱 Your sleep efficiency is low - consider reducing screen time before bed');
      }
      
      if (latestSession.sleepStages.deepSleep && latestSession.sleepStages.deepSleep < 60) {
        baseRecommendations.push('🏃‍♂️ Low deep sleep detected - regular exercise may help improve deep sleep');
      }
      
      if (latestSession.heartRateData && latestSession.heartRateData.length > 0) {
        const avgHeartRate = latestSession.heartRateData.reduce((sum, hr) => sum + hr.value, 0) / latestSession.heartRateData.length;
        if (avgHeartRate > 70) {
          baseRecommendations.push('❤️ Elevated heart rate during sleep - consider stress reduction techniques');
        }
      }
    }

    return baseRecommendations;
  };

  // Load initial data and check HealthKit permissions
  useEffect(() => {
    getSleepLogs();
    getSleepStats();
    
    if (state.healthKitAvailable) {
      checkHealthKitPermissions();
    }
  }, []);

  // Auto-sync HealthKit data daily
  useEffect(() => {
    if (state.healthKitEnabled) {
      const interval = setInterval(() => {
        syncHealthKitData();
      }, 24 * 60 * 60 * 1000); // Once per day

      return () => clearInterval(interval);
    }
  }, [state.healthKitEnabled]);

  return {
    ...state,
    createSleepLog,
    getSleepLogs,
    getSleepStats,
    adjustSleepForCurrentLocation,
    getSleepRecommendations,
    // HealthKit functions
    enableHealthKitTracking,
    syncHealthKitData,
    getHealthKitSleepData,
    checkHealthKitPermissions,
    getEnhancedSleepRecommendations,
  };
};