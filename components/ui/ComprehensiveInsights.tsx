import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useWeatherMood } from '../../hooks/useWeatherMood';
import { useMood } from '../../hooks/useMood';
import { useLocation } from '../../hooks/useLocation';
import WeatherCard from './WeatherCard';
import MoodWeatherCorrelation from './MoodWeatherCorrelation';
import ExpensiveStoreAlert from './ExpensiveStoreAlert';
import { Loader2, MapPin, AlertCircle, RefreshCw } from 'lucide-react-native';
import LoadingScreen from './LoadingScreen';

interface ComprehensiveInsightsProps {
  userId: string;
  style?: any;
}

const ComprehensiveInsights: React.FC<ComprehensiveInsightsProps> = ({ 
  userId, 
  style 
}) => {
  console.log('[ComprehensiveInsights] Component mounted with userId:', userId);
  
  const { location, getCurrentLocation, isLoading: locationLoading, permissionStatus } = useLocation();
  const { moodEntries, getMoodTrends, refreshMoodEntries } = useMood();
  const { 
    comprehensiveData, 
    getComprehensiveData, 
    isLoading: weatherMoodLoading,
    error 
  } = useWeatherMood(userId);

  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Refresh mood entries when component mounts to get latest mood data
  useEffect(() => {
    console.log('[ComprehensiveInsights] Refreshing mood entries on mount');
    refreshMoodEntries();
  }, [refreshMoodEntries]);

  // Refresh mood entries when component is focused (user navigates to insights page)
  useFocusEffect(
    React.useCallback(() => {
      console.log('[ComprehensiveInsights] Component focused, refreshing mood entries');
      refreshMoodEntries();
    }, [refreshMoodEntries])
  );

  // Refetch comprehensive data when moodEntries change
  useEffect(() => {
    if (moodEntries.length > 0 && location) {
      console.log('[ComprehensiveInsights] Mood entries updated, refetching comprehensive data');
      console.log('[ComprehensiveInsights] Current mood:', moodEntries[0]?.moodValue);
      fetchComprehensiveData();
    }
  }, [moodEntries.length, moodEntries[0]?.moodValue, location]);

  console.log('[ComprehensiveInsights] Hook values:', {
    hasLocation: !!location,
    locationCoords: location ? `${location.latitude}, ${location.longitude}` : 'no location',
    locationLoading,
    permissionStatus,
    moodEntriesLength: moodEntries.length,
    moodEntries: moodEntries.slice(0, 3), // Show first 3 entries for debugging
    weatherMoodLoading,
    error,
    hasComprehensiveData: !!comprehensiveData,
  });

  // Get the latest mood entry or use a default value
  const currentMood = moodEntries.length > 0 ? moodEntries[0].moodValue : 5; // Default to neutral (5)

  const fetchComprehensiveData = async () => {
    console.log('[ComprehensiveInsights] fetchComprehensiveData called');
    
    if (!location && !locationLoading) {
      console.log('[ComprehensiveInsights] No location, trying to get current location...');
      const currentLocation = await getCurrentLocation();
      if (!currentLocation) {
        console.log('[ComprehensiveInsights] Failed to get current location');
        Alert.alert(
          'Location Required',
          'Please enable location services to get weather and location insights.'
        );
        return;
      }
    }

    if (location) {
      console.log('[ComprehensiveInsights] Calling getComprehensiveData with:', {
        currentMood,
        moodEntriesCount: moodEntries.length,
        latestMoodEntry: moodEntries[0],
        latitude: location.latitude,
        longitude: location.longitude
      });
      
      const data = await getComprehensiveData(
        currentMood,
        location.latitude,
        location.longitude
      );
      
      console.log('[ComprehensiveInsights] getComprehensiveData result:', data);
      
      if (data) {
        setLastUpdated(new Date());
      }
    } else {
      console.log('[ComprehensiveInsights] No location available for comprehensive data');
    }
  };

  const onRefresh = async () => {
    console.log('[ComprehensiveInsights] Manual refresh triggered');
    setRefreshing(true);
    await refreshMoodEntries(); // Refresh mood entries first
    await fetchComprehensiveData();
    setRefreshing(false);
  };

  useEffect(() => {
    console.log('[ComprehensiveInsights] useEffect called');
    console.log('[ComprehensiveInsights] useEffect triggered:', {
      hasLocation: !!location,
      locationLoading,
      permissionStatus,
      locationCoords: location ? `${location.latitude}, ${location.longitude}` : 'no location'
    });
    
    if (location) {
      console.log('[ComprehensiveInsights] Location available, calling fetchComprehensiveData');
      fetchComprehensiveData();
    } else if (!locationLoading && permissionStatus !== 'undetermined') {
      console.log('[ComprehensiveInsights] No location but permission determined, trying to get location');
      // If location is not loading and permission is determined (granted/denied), try to get location
      getCurrentLocation().then((currentLocation) => {
        if (currentLocation) {
          console.log('[ComprehensiveInsights] Got current location, calling fetchComprehensiveData');
          fetchComprehensiveData();
        } else {
          console.log('[ComprehensiveInsights] Failed to get current location');
        }
      });
    } else {
      console.log('[ComprehensiveInsights] Not calling fetchComprehensiveData:', {
        locationLoading,
        permissionStatus
      });
    }
  }, [location, locationLoading, permissionStatus]);

  const isLoading = locationLoading || weatherMoodLoading;

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <AlertCircle size={32} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Show location permission message only if location is explicitly denied
  if (permissionStatus === 'denied' || (permissionStatus === 'undetermined' && !location && !locationLoading)) {
    return (
      <View style={[styles.container, styles.emptyContainer, style]}>
        <MapPin size={32} color="#666" />
        <Text style={styles.emptyText}>
          Enable location services to get personalized insights
        </Text>
      </View>
    );
  }

  // Show loading only if we're actively loading location or weather data
  if (isLoading) {
    return (
      <LoadingScreen 
        type="insights"
        size="medium"
        message="Loading comprehensive insights..."
        subMessage="Analyzing your data patterns"
      />
    );
  }

  // Show empty state only if we have no comprehensive data
  if (!comprehensiveData) {
    return (
      <View style={[styles.container, styles.emptyContainer, style]}>
        <MapPin size={32} color="#666" />
        <Text style={styles.emptyText}>
          No weather data available. Try refreshing.
        </Text>
      </View>
    );
  }

  // Safety check: if comprehensiveData exists but is null or has no useful data
  if (!comprehensiveData || (!comprehensiveData.weather && !comprehensiveData.moodCorrelation && !comprehensiveData.nearbyStores)) {
    console.log('[ComprehensiveInsights] comprehensiveData is null or empty:', comprehensiveData);
    console.log('[ComprehensiveInsights] Debug info:', {
      hasComprehensiveData: !!comprehensiveData,
      hasWeather: !!comprehensiveData?.weather,
      hasMoodCorrelation: !!comprehensiveData?.moodCorrelation,
      hasNearbyStores: !!comprehensiveData?.nearbyStores,
      weatherMoodLoading,
      error,
      location: location ? `${location.latitude}, ${location.longitude}` : 'no location'
    });
    
    return (
      <View style={[styles.container, styles.emptyContainer, style]}>
        <MapPin size={32} color="#666" />
        <Text style={styles.emptyText}>
          No comprehensive data available. Try refreshing.
        </Text>
        <Text style={styles.debugText}>
          Debug: {error || 'No error'} | Loading: {weatherMoodLoading ? 'Yes' : 'No'}
        </Text>
               <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                 <RefreshCw size={16} color="#666" />
                 <Text style={styles.refreshButtonText}>Refresh</Text>
               </TouchableOpacity>
               <TouchableOpacity style={[styles.refreshButton, { marginTop: 8 }]} onPress={fetchComprehensiveData}>
                 <RefreshCw size={16} color="#666" />
                 <Text style={styles.refreshButtonText}>Force Fetch</Text>
               </TouchableOpacity>
      </View>
    );
  }

  console.log('[ComprehensiveInsights] Rendering with comprehensiveData:', {
    hasWeather: !!comprehensiveData.weather,
    hasMoodCorrelation: !!comprehensiveData.moodCorrelation,
    hasNearbyStores: !!comprehensiveData.nearbyStores,
    hasSleepAdjustment: !!comprehensiveData.sleepAdjustment,
    hasRecommendations: !!comprehensiveData.recommendations,
    comprehensiveDataKeys: Object.keys(comprehensiveData),
  });

  return (
    <ScrollView
      style={[styles.container, style]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {lastUpdated && (
        <View style={styles.lastUpdatedContainer}>
          <Text style={styles.lastUpdatedText}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Text>
        </View>
      )}

      {/* Weather Card */}
      {comprehensiveData.weather && (
        <WeatherCard weather={comprehensiveData.weather} />
      )}

      {/* Mood-Weather Correlation */}
      {comprehensiveData.moodCorrelation && (
        <MoodWeatherCorrelation correlation={comprehensiveData.moodCorrelation} />
      )}

      {/* Expensive Store Alert */}
      {comprehensiveData.nearbyStores && comprehensiveData.nearbyStores.length > 0 && (
        <ExpensiveStoreAlert stores={comprehensiveData.nearbyStores} />
      )}

      {/* Sleep Adjustment Info */}
      {comprehensiveData.sleepAdjustment && (
        <View style={styles.sleepAdjustmentContainer}>
          <Text style={styles.sleepAdjustmentTitle}>Sleep Tracking</Text>
          <View style={styles.sleepAdjustmentContent}>
            <View style={styles.sleepAdjustmentItem}>
              <Text style={styles.sleepAdjustmentLabel}>Current Timezone</Text>
              <Text style={styles.sleepAdjustmentValue}>
                {comprehensiveData.sleepAdjustment.timezone}
              </Text>
            </View>
            <View style={styles.sleepAdjustmentItem}>
              <Text style={styles.sleepAdjustmentLabel}>Sleep Duration</Text>
              <Text style={styles.sleepAdjustmentValue}>
                {comprehensiveData.sleepAdjustment.sleepDuration.toFixed(1)} hours
              </Text>
            </View>
            <View style={styles.sleepAdjustmentItem}>
              <Text style={styles.sleepAdjustmentLabel}>Sleep Quality</Text>
              <Text style={styles.sleepAdjustmentValue}>
                {comprehensiveData.sleepAdjustment.sleepQuality}/10
              </Text>
            </View>
          </View>
          {comprehensiveData.sleepAdjustment.locationAdjusted && (
            <View style={styles.sleepAdjustmentNote}>
              <Text style={styles.sleepAdjustmentNoteText}>
                ✓ Sleep times adjusted for your current location
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Comprehensive Recommendations */}
      {comprehensiveData.recommendations && comprehensiveData.recommendations.length > 0 && (
        <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsTitle}>
            💡 Personalized Recommendations
          </Text>
          {comprehensiveData.recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Text style={styles.recommendationBullet}>•</Text>
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Location Info */}
      {location && comprehensiveData?.weather?.location && (
        <View style={styles.locationContainer}>
          <Text style={styles.locationTitle}>📍 Current Location</Text>
          <Text style={styles.locationText}>
            {comprehensiveData.weather.location.city}, {comprehensiveData.weather.location.country}
          </Text>
          <Text style={styles.locationCoordinates}>
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  debugText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  lastUpdatedContainer: {
    padding: 10,
    alignItems: 'center',
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#999',
  },
  sleepAdjustmentContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 10,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sleepAdjustmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  sleepAdjustmentContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sleepAdjustmentItem: {
    alignItems: 'center',
    flex: 1,
  },
  sleepAdjustmentLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  sleepAdjustmentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  sleepAdjustmentNote: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
  },
  sleepAdjustmentNoteText: {
    fontSize: 12,
    color: '#2E7D32',
    textAlign: 'center',
  },
  recommendationsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 10,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationBullet: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 8,
    marginTop: 2,
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 18,
  },
  locationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 10,
    marginVertical: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationCoordinates: {
    fontSize: 12,
    color: '#999',
  },
});

export default ComprehensiveInsights;