import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { useWeatherMood } from '../../hooks/useWeatherMood';
import { useMood } from '../../hooks/useMood';
import { useLocation } from '../../hooks/useLocation';
import WeatherCard from './WeatherCard';
import MoodWeatherCorrelation from './MoodWeatherCorrelation';
import ExpensiveStoreAlert from './ExpensiveStoreAlert';
import { Loader2, MapPin, AlertCircle } from 'lucide-react-native';
import LoadingScreen from './LoadingScreen';

interface ComprehensiveInsightsProps {
  userId: string;
  style?: any;
}

const ComprehensiveInsights: React.FC<ComprehensiveInsightsProps> = ({ 
  userId, 
  style 
}) => {
  const { location, getCurrentLocation, isLoading: locationLoading } = useLocation();
  const { currentMood, getMoodTrends } = useMood();
  const { 
    comprehensiveData, 
    getComprehensiveData, 
    isLoading: weatherMoodLoading,
    error 
  } = useWeatherMood(userId);

  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchComprehensiveData = async () => {
    if (!location && !locationLoading) {
      const currentLocation = await getCurrentLocation();
      if (!currentLocation) {
        Alert.alert(
          'Location Required',
          'Please enable location services to get weather and location insights.'
        );
        return;
      }
    }

    if (location && currentMood) {
      const data = await getComprehensiveData(
        currentMood,
        location.latitude,
        location.longitude
      );
      
      if (data) {
        setLastUpdated(new Date());
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchComprehensiveData();
    setRefreshing(false);
  };

  useEffect(() => {
    if (location && currentMood) {
      fetchComprehensiveData();
    }
  }, [location, currentMood]);

  const isLoading = locationLoading || weatherMoodLoading;

  if (isLoading && !comprehensiveData) {
    return (
      <LoadingScreen 
        type="insights"
        size="medium"
        message="Loading comprehensive insights..."
        subMessage="Analyzing your data patterns"
      />
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <AlertCircle size={32} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!comprehensiveData) {
    return (
      <View style={[styles.container, styles.emptyContainer, style]}>
        <MapPin size={32} color="#666" />
        <Text style={styles.emptyText}>
          Enable location services to get personalized insights
        </Text>
      </View>
    );
  }

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
      {location && (
        <View style={styles.locationContainer}>
          <Text style={styles.locationTitle}>📍 Current Location</Text>
          <Text style={styles.locationText}>
            {comprehensiveData.weather?.location.city}, {comprehensiveData.weather?.location.country}
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