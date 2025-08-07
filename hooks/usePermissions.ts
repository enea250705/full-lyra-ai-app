import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { useLocation } from './useLocation';
import { useSleep } from './useSleep';
import { appleHealthKitService } from '@/services/appleHealthKit';

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

  // Check HealthKit availability
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

      const location = await getCurrentLocation();
      const granted = !!location;

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
  }, [getCurrentLocation]);

  // Request HealthKit permissions
  const requestHealthKitPermission = useCallback(async () => {
    try {
      const isAvailable = await checkHealthKitAvailability();
      if (!isAvailable) {
        console.log('[usePermissions] HealthKit not available on this device');
        return false;
      }

      console.log('[usePermissions] Requesting HealthKit permissions...');
      setPermissions(prev => ({
        ...prev,
        healthKit: { ...prev.healthKit, requested: true }
      }));

      // Request HealthKit permissions with proper error handling
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
      // Request permissions in parallel
      const [locationGranted, healthKitGranted] = await Promise.allSettled([
        requestLocationPermission(),
        requestHealthKitPermission(),
      ]);

      const results = {
        location: locationGranted.status === 'fulfilled' ? locationGranted.value : false,
        healthKit: healthKitGranted.status === 'fulfilled' ? healthKitGranted.value : false,
      };

      // Update permissions state
      setPermissions(prev => ({
        ...prev,
        location: { granted: results.location, requested: true },
        healthKit: { granted: results.healthKit, requested: true, available: prev.healthKit.available },
        isLoading: false,
      }));

      // Show summary to user
      const grantedPermissions = [];
      const deniedPermissions = [];

      if (results.location) grantedPermissions.push('Location');
      else deniedPermissions.push('Location');

      if (results.healthKit) grantedPermissions.push('Health & Sleep Tracking');
      else deniedPermissions.push('Health & Sleep Tracking');

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
      return { location: false, healthKit: false };
    } finally {
      setIsLoading(false);
    }
  }, [requestLocationPermission, requestHealthKitPermission]);

  // Check current permissions status
  const checkCurrentPermissions = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Check HealthKit availability and permissions
      const healthKitAvailable = await checkHealthKitAvailability();
      let healthKitGranted = false;
      
      if (healthKitAvailable) {
        healthKitGranted = await checkHealthKitPermissions();
      }

      // Check location permission (this will trigger the permission request if not granted)
      const locationGranted = await requestLocationPermission();

      setPermissions({
        location: { granted: locationGranted, requested: true },
        healthKit: { granted: healthKitGranted, requested: true, available: healthKitAvailable },
        notifications: { granted: false, requested: false }, // TODO: Implement notifications
        isLoading: false,
      });

    } catch (error) {
      console.error('[usePermissions] Error checking permissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [checkHealthKitAvailability, checkHealthKitPermissions, requestLocationPermission]);

  // Initialize permissions on mount
  useEffect(() => {
    // Only check permissions if they haven't been requested yet
    if (!permissions.location.requested && !permissions.healthKit.requested) {
      checkCurrentPermissions();
    } else {
      setIsLoading(false);
    }
  }, [checkCurrentPermissions, permissions.location.requested, permissions.healthKit.requested]);

  return {
    permissions,
    isLoading,
    requestLocationPermission,
    requestHealthKitPermission,
    requestAllPermissions,
    checkCurrentPermissions,
  };
}; 