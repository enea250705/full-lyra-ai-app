import { useState, useCallback, useEffect } from 'react';
import { useApi, useMutation } from './useApi';
import { apiService } from '../services/api';
import googleFitAuthService, { GoogleFitAuthResult, GoogleFitConnectionStatus } from '../services/googleFitAuth';

// Google Fit Data Types
export interface GoogleFitSteps {
  id: string;
  date: string;
  steps: number;
  distance: number;
  calories: number;
  activeMinutes: number;
}

export interface GoogleFitHeartRate {
  id: string;
  timestamp: string;
  bpm: number;
  accuracy?: number;
}

export interface GoogleFitActivity {
  id: string;
  activityType: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  calories?: number;
  distance?: number;
  steps?: number;
}

export interface GoogleFitSleep {
  id: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  durationHours: number;
  sleepStages?: {
    light: number;
    deep: number;
    rem: number;
    awake: number;
  };
}

export interface GoogleFitWeight {
  id: string;
  timestamp: string;
  weightKg: number;
  bodyFatPercentage?: number;
  muscleMassKg?: number;
}

export interface GoogleFitDashboardData {
  today: {
    steps: number;
    stepsGoalProgress: number;
    averageHeartRate: number;
    distance: number;
    calories: number;
  };
  weekly: {
    averageSteps: number;
    activityStats: any;
  };
  latest: {
    weight: GoogleFitWeight | null;
    activities: GoogleFitActivity[];
  };
  syncHealth: {
    status: 'healthy' | 'degraded' | 'critical';
    lastFullSync: string | null;
    failedDataTypes: string[];
    staleDataTypes: string[];
    successRate: number;
  };
}

export const useGoogleFit = () => {
  const [connectionStatus, setConnectionStatus] = useState<GoogleFitConnectionStatus | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch connection status
  const {
    data: statusData,
    loading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useApi(() => googleFitAuthService.getConnectionStatus(), {
    immediate: false,
    onSuccess: (data) => setConnectionStatus(data),
  });

  // Sync mutation
  const syncMutation = useMutation<any, { days?: number }>((data) => 
    googleFitAuthService.syncGoogleFitData(data.days)
  );

  // Load connection status on mount
  useEffect(() => {
    loadConnectionStatus();
  }, []);

  const loadConnectionStatus = useCallback(async () => {
    try {
      await refetchStatus();
    } catch (error) {
      console.error('Error loading Google Fit connection status:', error);
    }
  }, [refetchStatus]);

  // Connect Google Fit
  const connectGoogleFit = useCallback(async (): Promise<GoogleFitAuthResult> => {
    setIsConnecting(true);
    try {
      const result = await googleFitAuthService.connectGoogleFit();
      
      if (result.success) {
        // Refresh connection status
        await loadConnectionStatus();
        
        // Auto-sync data after successful connection
        await syncGoogleFitData(30);
      }
      
      return result;
    } catch (error) {
      console.error('Error connecting Google Fit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    } finally {
      setIsConnecting(false);
    }
  }, [loadConnectionStatus]);

  // Disconnect Google Fit
  const disconnectGoogleFit = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await googleFitAuthService.disconnectGoogleFit();
      
      if (result.success) {
        await loadConnectionStatus();
      }
      
      return result;
    } catch (error) {
      console.error('Error disconnecting Google Fit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Disconnect failed'
      };
    }
  }, [loadConnectionStatus]);

  // Sync Google Fit data
  const syncGoogleFitData = useCallback(async (days: number = 30) => {
    setIsSyncing(true);
    try {
      const result = await syncMutation.mutate({ days });
      
      if (result.success) {
        // Refresh connection status to update sync health
        await loadConnectionStatus();
      }
      
      return result;
    } catch (error) {
      console.error('Error syncing Google Fit data:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [syncMutation, loadConnectionStatus]);

  // Check and request permissions
  const checkPermissions = useCallback(async () => {
    try {
      return await googleFitAuthService.checkFitnessPermissions();
    } catch (error) {
      console.error('Error checking permissions:', error);
      return {
        hasPermissions: false,
        missingScopes: []
      };
    }
  }, []);

  const requestPermissions = useCallback(async (missingScopes: string[]) => {
    setIsConnecting(true);
    try {
      const result = await googleFitAuthService.requestAdditionalPermissions(missingScopes);
      
      if (result.success) {
        await loadConnectionStatus();
      }
      
      return result;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Permission request failed'
      };
    } finally {
      setIsConnecting(false);
    }
  }, [loadConnectionStatus]);

  return {
    // Status
    connectionStatus,
    isConnected: connectionStatus?.connected || false,
    isConnecting,
    isSyncing,
    statusLoading,
    statusError,
    
    // Actions
    connectGoogleFit,
    disconnectGoogleFit,
    syncGoogleFitData,
    checkPermissions,
    requestPermissions,
    refreshStatus: loadConnectionStatus,
    
    // Sync info
    syncHealth: connectionStatus?.syncHealth,
    lastSync: connectionStatus?.syncHealth?.lastFullSync,
  };
};

// Hook for Google Fit steps data
export const useGoogleFitSteps = (startDate?: string, endDate?: string) => {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allSteps, setAllSteps] = useState<GoogleFitSteps[]>([]);

  const {
    data: stepsData,
    loading,
    error,
    refetch,
  } = useApi(() => apiService.getGoogleFitSteps(page, 30, startDate, endDate), {
    deps: [page, startDate, endDate],
    onSuccess: (data) => {
      if (page === 1) {
        setAllSteps(data.steps);
      } else {
        setAllSteps(prev => [...prev, ...data.steps]);
      }
      setHasMore(data.pagination.page < data.pagination.totalPages);
    }
  });

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, loading]);

  const refresh = useCallback(() => {
    setPage(1);
    setAllSteps([]);
    refetch();
  }, [refetch]);

  return {
    steps: allSteps,
    analytics: stepsData?.analytics,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
};

// Hook for Google Fit heart rate data
export const useGoogleFitHeartRate = (date?: string) => {
  const {
    data: heartRateData,
    loading,
    error,
    refetch,
  } = useApi(() => apiService.getGoogleFitHeartRate(date), {
    deps: [date]
  });

  return {
    heartRateData: heartRateData?.heartRateData || [],
    analytics: heartRateData?.analytics,
    loading,
    error,
    refetch,
  };
};

// Hook for Google Fit activities data
export const useGoogleFitActivities = (startDate?: string, endDate?: string) => {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allActivities, setAllActivities] = useState<GoogleFitActivity[]>([]);

  const {
    data: activitiesData,
    loading,
    error,
    refetch,
  } = useApi(() => apiService.getGoogleFitActivities(page, 20, startDate, endDate), {
    deps: [page, startDate, endDate],
    onSuccess: (data) => {
      if (page === 1) {
        setAllActivities(data.activities);
      } else {
        setAllActivities(prev => [...prev, ...data.activities]);
      }
      setHasMore(data.pagination.page < data.pagination.totalPages);
    }
  });

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, loading]);

  const refresh = useCallback(() => {
    setPage(1);
    setAllActivities([]);
    refetch();
  }, [refetch]);

  return {
    activities: allActivities,
    analytics: activitiesData?.analytics,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
};

// Hook for Google Fit sleep data
export const useGoogleFitSleep = (startDate?: string, endDate?: string) => {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allSleep, setAllSleep] = useState<GoogleFitSleep[]>([]);

  const {
    data: sleepData,
    loading,
    error,
    refetch,
  } = useApi(() => apiService.getGoogleFitSleep(page, 30, startDate, endDate), {
    deps: [page, startDate, endDate],
    onSuccess: (data) => {
      if (page === 1) {
        setAllSleep(data.sleepData);
      } else {
        setAllSleep(prev => [...prev, ...data.sleepData]);
      }
      setHasMore(data.pagination.page < data.pagination.totalPages);
    }
  });

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, loading]);

  const refresh = useCallback(() => {
    setPage(1);
    setAllSleep([]);
    refetch();
  }, [refetch]);

  return {
    sleepData: allSleep,
    analytics: sleepData?.analytics,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
};

// Hook for Google Fit weight data
export const useGoogleFitWeight = (startDate?: string, endDate?: string) => {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allWeight, setAllWeight] = useState<GoogleFitWeight[]>([]);

  const {
    data: weightData,
    loading,
    error,
    refetch,
  } = useApi(() => apiService.getGoogleFitWeight(page, 30, startDate, endDate), {
    deps: [page, startDate, endDate],
    onSuccess: (data) => {
      if (page === 1) {
        setAllWeight(data.weightData);
      } else {
        setAllWeight(prev => [...prev, ...data.weightData]);
      }
      setHasMore(data.pagination.page < data.pagination.totalPages);
    }
  });

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, loading]);

  const refresh = useCallback(() => {
    setPage(1);
    setAllWeight([]);
    refetch();
  }, [refetch]);

  return {
    weightData: allWeight,
    analytics: weightData?.analytics,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
};

// Hook for Google Fit dashboard data
export const useGoogleFitDashboard = () => {
  const {
    data: dashboardData,
    loading,
    error,
    refetch,
  } = useApi<GoogleFitDashboardData>(() => apiService.getGoogleFitDashboard(), {
    immediate: false
  });

  return {
    dashboardData,
    loading,
    error,
    refetch,
  };
}; 