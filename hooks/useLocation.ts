import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

interface LocationState {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  permissionStatus: Location.PermissionStatus | null;
}

export const useLocation = () => {
  const [state, setState] = useState<LocationState>({
    location: null,
    isLoading: false,
    error: null,
    permissionStatus: null,
  });

  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setState(prev => ({ ...prev, permissionStatus: status }));
      
      if (status !== 'granted') {
        setState(prev => ({ 
          ...prev, 
          error: 'Location permission denied. Please enable location access in settings.' 
        }));
        return false;
      }
      
      return true;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to request location permission' 
      }));
      return false;
    }
  };

  const getCurrentLocation = async (): Promise<LocationData | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setState(prev => ({ ...prev, isLoading: false }));
        return null;
      }

      const locationData = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 10,
      });

      const location: LocationData = {
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
        accuracy: locationData.coords.accuracy,
        timestamp: locationData.timestamp,
      };

      setState(prev => ({ 
        ...prev, 
        location, 
        isLoading: false, 
        error: null 
      }));

      return location;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to get current location' 
      }));
      return null;
    }
  };

  const watchLocation = async (callback: (location: LocationData) => void) => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) return null;

      const watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000, // 30 seconds
          distanceInterval: 50, // 50 meters
        },
        (locationData) => {
          const location: LocationData = {
            latitude: locationData.coords.latitude,
            longitude: locationData.coords.longitude,
            accuracy: locationData.coords.accuracy,
            timestamp: locationData.timestamp,
          };
          
          setState(prev => ({ ...prev, location }));
          callback(location);
        }
      );

      return watchSubscription;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to watch location' 
      }));
      return null;
    }
  };

  const checkPermissionStatus = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setState(prev => ({ ...prev, permissionStatus: status }));
      return status;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to check permission status' 
      }));
      return null;
    }
  };

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  return {
    ...state,
    getCurrentLocation,
    watchLocation,
    requestPermission,
    checkPermissionStatus,
  };
};