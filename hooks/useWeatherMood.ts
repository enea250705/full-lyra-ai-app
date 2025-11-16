import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useLocation } from './useLocation';

interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  cloudiness: number;
  weatherType: string;
  uvIndex: number;
  visibility: number;
  location: {
    city: string;
    country: string;
    lat: number;
    lon: number;
  };
  timezone: string;
}

interface MoodWeatherCorrelation {
  mood: number;
  weather: WeatherData;
  correlationScore: number;
  moodPrediction: string;
  recommendations: string[];
}

interface ExpensiveStore {
  name: string;
  category: string;
  distance: number;
  priceLevel: 'expensive' | 'very_expensive' | 'luxury';
  address: string;
}

interface ComprehensiveData {
  weather: WeatherData;
  moodCorrelation: MoodWeatherCorrelation;
  nearbyStores: ExpensiveStore[];
  sleepAdjustment: any;
  recommendations: string[];
}

interface WeatherMoodState {
  weather: WeatherData | null;
  moodCorrelation: MoodWeatherCorrelation | null;
  nearbyStores: ExpensiveStore[];
  comprehensiveData: ComprehensiveData | null;
  isLoading: boolean;
  error: string | null;
}

export const useWeatherMood = (userId?: string) => {
  const { location, getCurrentLocation } = useLocation();
  const [state, setState] = useState<WeatherMoodState>({
    weather: null,
    moodCorrelation: null,
    nearbyStores: [],
    comprehensiveData: null,
    isLoading: false,
    error: null,
  });

  const fetchWeatherData = async (lat?: number, lon?: number) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      let latitude = lat;
      let longitude = lon;
      
      if (!latitude || !longitude) {
        const currentLocation = await getCurrentLocation();
        if (!currentLocation) {
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'Unable to get location' 
          }));
          return null;
        }
        latitude = currentLocation.latitude;
        longitude = currentLocation.longitude;
      }

      const response = await apiService.getWeatherData(latitude, longitude);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          weather: response.data, 
          isLoading: false 
        }));
        return response.data;
      } else {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: response.error || 'Failed to fetch weather data' 
        }));
        return null;
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to fetch weather data' 
      }));
      return null;
    }
  };

  const correlateMoodWithWeather = async (mood: number, lat?: number, lon?: number) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      let latitude = lat;
      let longitude = lon;
      
      if (!latitude || !longitude) {
        const currentLocation = await getCurrentLocation();
        if (!currentLocation) {
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'Unable to get location' 
          }));
          return null;
        }
        latitude = currentLocation.latitude;
        longitude = currentLocation.longitude;
      }

      const response = await apiService.correlateMoodWithWeather(mood, latitude, longitude);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          moodCorrelation: response.data, 
          isLoading: false 
        }));
        return response.data;
      } else {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: response.error || 'Failed to correlate mood with weather' 
        }));
        return null;
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to correlate mood with weather' 
      }));
      return null;
    }
  };

  const fetchNearbyExpensiveStores = async (lat?: number, lon?: number) => {
    console.log('[useWeatherMood] fetchNearbyExpensiveStores called:', { lat, lon });
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      let latitude = lat;
      let longitude = lon;
      
      if (!latitude || !longitude) {
        console.log('[useWeatherMood] Getting current location for nearby stores...');
        const currentLocation = await getCurrentLocation();
        if (!currentLocation) {
          console.log('[useWeatherMood] Failed to get current location for nearby stores');
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'Unable to get location' 
          }));
          return [];
        }
        latitude = currentLocation.latitude;
        longitude = currentLocation.longitude;
        console.log('[useWeatherMood] Got location for nearby stores:', { latitude, longitude });
      }

      console.log('[useWeatherMood] Calling getNearbyExpensiveStores API with:', { latitude, longitude });
      const response = await apiService.getNearbyExpensiveStores(latitude, longitude);
      
      console.log('[useWeatherMood] getNearbyExpensiveStores API response:', { 
        success: response.success, 
        error: response.error, 
        dataLength: response.data?.length || 0 
      });
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          nearbyStores: response.data, 
          isLoading: false 
        }));
        return response.data;
      } else {
        console.log('[useWeatherMood] getNearbyExpensiveStores API failed:', response.error);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: response.error || 'Failed to fetch nearby stores' 
        }));
        return [];
      }
    } catch (error) {
      console.error('[useWeatherMood] Error in fetchNearbyExpensiveStores:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to fetch nearby stores' 
      }));
      return [];
    }
  };

  const getComprehensiveData = async (currentMood: number, lat?: number, lon?: number) => {
    console.log('[useWeatherMood] getComprehensiveData called:', { userId, currentMood, lat, lon });
    
    if (!userId) {
      console.log('[useWeatherMood] No userId provided');
      setState(prev => ({ 
        ...prev, 
        error: 'User ID is required for comprehensive data' 
      }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      let latitude = lat;
      let longitude = lon;
      
      if (!latitude || !longitude) {
        console.log('[useWeatherMood] Getting current location...');
        const currentLocation = await getCurrentLocation();
        if (!currentLocation) {
          console.log('[useWeatherMood] Failed to get current location');
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'Unable to get location' 
          }));
          return null;
        }
        latitude = currentLocation.latitude;
        longitude = currentLocation.longitude;
        console.log('[useWeatherMood] Got location:', { latitude, longitude });
      }

      console.log('[useWeatherMood] Calling API with:', { userId, latitude, longitude, currentMood });
      const response = await apiService.getComprehensiveLocationData(
        userId, 
        latitude, 
        longitude, 
        currentMood
      );
      
      console.log('[useWeatherMood] API response:', { 
        success: response.success, 
        error: response.error, 
        data: response.data,
        dataKeys: response.data ? Object.keys(response.data) : 'no data'
      });
      
      if (!response.success) {
        console.error('[useWeatherMood] API call failed:', response.error);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: response.error || 'Failed to get comprehensive data' 
        }));
        return null;
      }
      
      if (response.success) {
        // Ensure we have valid data structure even if some parts fail
        const comprehensiveData = {
          weather: response.data?.weather || null,
          moodCorrelation: response.data?.moodCorrelation || null,
          nearbyStores: response.data?.nearbyStores || [],
          sleepAdjustment: response.data?.sleepAdjustment || null,
          recommendations: response.data?.recommendations || [],
        };
        
        console.log('[useWeatherMood] Setting comprehensive data:', {
          hasWeather: !!comprehensiveData.weather,
          hasMoodCorrelation: !!comprehensiveData.moodCorrelation,
          hasNearbyStores: comprehensiveData.nearbyStores.length > 0,
          hasSleepAdjustment: !!comprehensiveData.sleepAdjustment,
          hasRecommendations: comprehensiveData.recommendations.length > 0,
          weatherData: comprehensiveData.weather,
          moodCorrelationData: comprehensiveData.moodCorrelation,
        });
        
        setState(prev => ({ 
          ...prev, 
          comprehensiveData,
          weather: comprehensiveData.weather,
          moodCorrelation: comprehensiveData.moodCorrelation,
          nearbyStores: comprehensiveData.nearbyStores,
          isLoading: false 
        }));
        return comprehensiveData;
      } else {
        console.log('[useWeatherMood] Comprehensive API failed:', response.error);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: response.error || 'Failed to fetch comprehensive data' 
        }));
        return null;
      }
    } catch (error) {
      console.error('[useWeatherMood] Error in getComprehensiveData:', error);
      console.error('[useWeatherMood] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        userId,
        lat,
        lon,
        currentMood
      });
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch comprehensive data' 
      }));
      return null;
    }
  };

  const adjustSleepForTimezone = async (sleepData?: any, lat?: number, lon?: number) => {
    if (!userId) {
      setState(prev => ({ 
        ...prev, 
        error: 'User ID is required for sleep adjustment' 
      }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      let latitude = lat;
      let longitude = lon;
      
      if (!latitude || !longitude) {
        const currentLocation = await getCurrentLocation();
        if (!currentLocation) {
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'Unable to get location' 
          }));
          return null;
        }
        latitude = currentLocation.latitude;
        longitude = currentLocation.longitude;
      }

      const response = await apiService.adjustSleepTracking(userId, latitude, longitude, sleepData);
      
      if (response.success) {
        setState(prev => ({ ...prev, isLoading: false }));
        return response.data;
      } else {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: response.error || 'Failed to adjust sleep tracking' 
        }));
        return null;
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to adjust sleep tracking' 
      }));
      return null;
    }
  };

  // Auto-fetch weather data when location changes
  useEffect(() => {
    if (location) {
      fetchWeatherData(location.latitude, location.longitude);
    }
  }, [location]);

  return {
    ...state,
    fetchWeatherData,
    correlateMoodWithWeather,
    fetchNearbyExpensiveStores,
    getComprehensiveData,
    adjustSleepForTimezone,
  };
};