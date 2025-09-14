import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { useLocation } from './useLocation';
import { useSleep } from './useSleep';
import { appleHealthKitService } from '@/services/appleHealthKit';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { apiService } from '@/services/api';

interface PermissionsState {
  location: {
    granted: boolean;
    requested: boolean;
  };
  healthKit: {
    granted: boolean;
    requested: boolean;
    available: boolean;
  };
  notifications: {
    granted: boolean;
    requested: boolean;
  };
  isLoading: boolean;
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<PermissionsState>({
    location: { granted: false, requested: false },
    healthKit: { granted: false, requested: false, available: false },
    notifications: { granted: false, requested: false },
    isLoading: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  const { getCurrentLocation } = useLocation();
  const { enableHealthKitTracking, checkHealthKitPermissions } = useSleep();

  // Configure notifications handler (foreground)
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  const requestNotificationsPermission = useCallback(async () => {
    try {
      console.log('[usePermissions] Requesting notification permissions...');
      setPermissions(prev => ({ ...prev, notifications: { ...prev.notifications, requested: true } }));
      
      // Request notification permissions with all necessary options
      const requestResult = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
          allowCriticalAlerts: false,
          provideAppNotificationSettings: true,
          allowProvisional: false,
        },
      });
      
      console.log('[usePermissions] Notification permission request result:', requestResult);
      
      const granted = requestResult.granted || requestResult.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED || false;
      
      // Save token if granted
      if (granted) {
        try {
          console.log('[usePermissions] Notification permission granted, getting push token...');
          const projectId = (Constants as any)?.easConfig?.projectId || (Constants as any)?.expoConfig?.extra?.eas?.projectId;
          const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
          console.log('[usePermissions] Got push token:', token);
          
          const resp = await apiService.saveExpoPushToken(token, { os: Platform.OS });
          if (resp?.success && resp?.data?.id) {
            console.log('[usePermissions] Push token saved successfully');
          } else {
            console.warn('[usePermissions] Failed to save push token to backend');
          }
        } catch (e) {
          console.warn('[usePermissions] Failed to save push token:', e);
        }
      } else {
        console.log('[usePermissions] Notification permission denied');
      }
      
      setPermissions(prev => ({ ...prev, notifications: { granted, requested: true } }));
      return granted;
    } catch (error) {
      console.error('[usePermissions] Notifications permission request failed:', error);
      setPermissions(prev => ({ ...prev, notifications: { granted: false, requested: true } }));
      return false;
    }
  }, []);

  // Check HealthKit availability and permissions
  const checkHealthKitAvailability = useCallback(async () => {
    try {
      const isAvailable = appleHealthKitService.isHealthKitAvailable();
      setPermissions(prev => ({
        ...prev,
        healthKit: { ...prev.healthKit, available: isAvailable }
      }));
      return isAvailable;
    } catch (error) {
      console.warn('[usePermissions] HealthKit availability check failed:', error);
      return false;
    }
  }, []);

  // Request location permissions
  const requestLocationPermission = useCallback(async () => {
    try {
      setPermissions(prev => ({
        ...prev,
        location: { ...prev.location, requested: true }
      }));

      // First check if permission is already granted
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus === 'granted') {
        setPermissions(prev => ({
          ...prev,
          location: { granted: true, requested: true }
        }));
        return true;
      }

      // Request permission if not granted
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';

      setPermissions(prev => ({
        ...prev,
        location: { granted, requested: true }
      }));

      return granted;
    } catch (error) {
      console.error('[usePermissions] Location permission request failed:', error);
      setPermissions(prev => ({
        ...prev,
        location: { granted: false, requested: true }
      }));
      return false;
    }
  }, []);

  // Request HealthKit permissions
  const requestHealthKitPermission = useCallback(async () => {
    try {
      const isAvailable = await checkHealthKitAvailability();
      if (!isAvailable) {
        console.log('[usePermissions] HealthKit not available on this device');
        setPermissions(prev => ({
          ...prev,
          healthKit: { granted: false, requested: true, available: false }
        }));
        return false;
      }

      console.log('[usePermissions] Requesting HealthKit permissions...');
      setPermissions(prev => ({
        ...prev,
        healthKit: { ...prev.healthKit, requested: true }
      }));

      // Check if permission is already granted
      const isGranted = await appleHealthKitService.isPermissionGranted();
      if (isGranted) {
        setPermissions(prev => ({
          ...prev,
          healthKit: { granted: true, requested: true, available: isAvailable }
        }));
        return true;
      }

      // Request HealthKit permissions
      const granted = await enableHealthKitTracking();
      
      console.log('[usePermissions] HealthKit permission result:', granted);
      setPermissions(prev => ({
        ...prev,
        healthKit: { granted, requested: true, available: isAvailable }
      }));

      return granted;
    } catch (error) {
      console.error('[usePermissions] HealthKit permission request failed:', error);
      setPermissions(prev => ({
        ...prev,
        healthKit: { granted: false, requested: true, available: false }
      }));
      return false;
    }
  }, [checkHealthKitAvailability, enableHealthKitTracking]);

  // Request all permissions
  const requestAllPermissions = useCallback(async () => {
    setIsLoading(true);
    
    try {
      console.log('[usePermissions] Starting to request all permissions...');
      
      // Request permissions sequentially to ensure proper state updates
      const locationGranted = await requestLocationPermission();
      console.log('[usePermissions] Location permission result:', locationGranted);
      
      const healthKitGranted = await requestHealthKitPermission();
      console.log('[usePermissions] HealthKit permission result:', healthKitGranted);
      
      const notificationsGranted = await requestNotificationsPermission();
      console.log('[usePermissions] Notifications permission result:', notificationsGranted);

      const results = {
        location: locationGranted,
        healthKit: healthKitGranted,
        notifications: notificationsGranted,
      };

      console.log('[usePermissions] All permission results:', results);

      // Update permissions state
      setPermissions(prev => ({
        ...prev,
        location: { granted: results.location, requested: true },
        healthKit: { granted: results.healthKit, requested: true, available: prev.healthKit.available },
        notifications: { granted: results.notifications, requested: true },
        isLoading: false,
      }));

      // Show summary to user
      const grantedPermissions: string[] = [];
      const deniedPermissions: string[] = [];

      if (results.location) grantedPermissions.push('Location');
      else deniedPermissions.push('Location');

      if (results.healthKit) grantedPermissions.push('Health & Sleep Tracking');
      else deniedPermissions.push('Health & Sleep Tracking');

      if (results.notifications) grantedPermissions.push('Notifications');
      else deniedPermissions.push('Notifications');

      if (grantedPermissions.length > 0) {
        Alert.alert(
          'Permissions Granted ✅',
          `Great! You've granted access to: ${grantedPermissions.join(', ')}. This will help Lyra provide personalized insights.`,
          [{ text: 'Continue', style: 'default' }]
        );
      }

      if (deniedPermissions.length > 0) {
        Alert.alert(
          'Some Permissions Denied',
          `You can still use Lyra, but some features may be limited. You can enable these permissions later in Settings:\n\n${deniedPermissions.join('\n')}`,
          [{ text: 'OK', style: 'default' }]
        );
      }

      return results;
    } catch (error) {
      console.error('[usePermissions] Error requesting permissions:', error);
      return { location: false, healthKit: false, notifications: false };
    } finally {
      setIsLoading(false);
    }
  }, [requestLocationPermission, requestHealthKitPermission, requestNotificationsPermission]);

  // Check current permissions status
  const checkCurrentPermissions = useCallback(async () => {
    setIsLoading(true);
    
    try {
      console.log('[usePermissions] Checking current permissions...');
      
      // Check HealthKit availability and permissions
      const healthKitAvailable = await checkHealthKitAvailability();
      let healthKitGranted = false;
      
      if (healthKitAvailable) {
        healthKitGranted = await checkHealthKitPermissions();
        console.log('[usePermissions] HealthKit status:', { available: healthKitAvailable, granted: healthKitGranted });
      } else {
        console.log('[usePermissions] HealthKit not available on this device');
      }

      // Check location permission status
      const { status: locationStatus } = await Location.getForegroundPermissionsAsync();
      const locationGranted = locationStatus === 'granted';
      console.log('[usePermissions] Location status:', { status: locationStatus, granted: locationGranted });

      // Check notifications status
      const notifPerms = await Notifications.getPermissionsAsync();
      const notificationsGranted = notifPerms.granted || notifPerms.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED || false;
      console.log('[usePermissions] Notifications status:', { granted: notificationsGranted, iosStatus: notifPerms.ios?.status });

      const updatedPermissions = {
        location: { granted: locationGranted, requested: true },
        healthKit: { granted: healthKitGranted, requested: true, available: healthKitAvailable },
        notifications: { granted: notificationsGranted, requested: true },
        isLoading: false,
      };

      console.log('[usePermissions] Updated permissions:', updatedPermissions);
      setPermissions(updatedPermissions);

    } catch (error) {
      console.error('[usePermissions] Error checking permissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [checkHealthKitAvailability, checkHealthKitPermissions]);

  // Initialize permissions on mount
  useEffect(() => {
    // Run once on mount
    checkCurrentPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    permissions,
    isLoading,
    requestLocationPermission,
    requestHealthKitPermission,
    requestNotificationsPermission,
    requestAllPermissions,
    checkCurrentPermissions,
  };
}; 