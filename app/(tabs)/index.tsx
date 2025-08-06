import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { MoodPicker } from '@/components/ui/MoodPicker';
import { InsightCard } from '@/components/ui/InsightCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import WeatherCard from '@/components/ui/WeatherCard';
import ExpensiveStoreAlert from '@/components/ui/ExpensiveStoreAlert';
import SavingsCounter from '@/components/ui/SavingsCounter';
import SubscriptionUpgradeModal from '@/components/ui/SubscriptionUpgradeModal';
import { PermissionsRequestModal } from '@/components/ui/PermissionsRequestModal';
import { useUserData } from '@/hooks/useUserData';
import { useWeatherMood } from '@/hooks/useWeatherMood';
import { useLocation } from '@/hooks/useLocation';
import { useSavings } from '@/hooks/useSavings';
import { useSubscription } from '@/hooks/useSubscription';
import { usePermissions } from '@/hooks/usePermissions';
import { colors } from '@/constants/colors';
import { getGreeting } from '@/utils/dateUtils';
import { Mood } from '@/types';
import { Moon, Battery, MessageCircle, MapPin, CloudSun } from 'lucide-react-native';
import SafeLoadingScreen from '@/components/ui/SafeLoadingScreen';

export default function HomeScreen() {
  const router = useRouter();
  const { userData, updateUserData, loading } = useUserData();
  const { location, getCurrentLocation } = useLocation();
  const { 
    weather, 
    moodCorrelation, 
    nearbyStores, 
    fetchWeatherData, 
    correlateMoodWithWeather,
    fetchNearbyExpensiveStores 
  } = useWeatherMood();
  
  const { savings, loading: savingsLoading, recordSavings, fetchSavingsStats } = useSavings();
  const { subscription } = useSubscription();
  const { permissions, requestAllPermissions, isLoading: permissionsLoading } = usePermissions();
  
  const [currentMood, setCurrentMood] = useState<Mood>(userData?.mood || 'neutral');
  const [showStoreAlert, setShowStoreAlert] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  // Update mood when userData changes
  useEffect(() => {
    if (userData?.mood) {
      setCurrentMood(userData.mood);
    }
  }, [userData?.mood]);
  
  // Convert mood string to number for API
  const moodToNumber = (mood: Mood): number => {
    const moodMap = {
      'terrible': 2,
      'bad': 4,
      'neutral': 5,
      'good': 7,
      'great': 9
    };
    return moodMap[mood] || 5;
  };

  const handleMoodChange = (mood: Mood) => {
    setCurrentMood(mood);
    updateUserData({ mood });
    
    // Correlate mood with weather when mood changes (only if location is available)
    if (location && location.latitude && location.longitude) {
      const moodNumber = moodToNumber(mood);
      correlateMoodWithWeather(moodNumber, location.latitude, location.longitude);
    }
  };

  const handleStartChat = () => {
    router.push('/chat');
  };

  const handleLocationPermission = async () => {
    try {
      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        await fetchWeatherData(currentLocation.latitude, currentLocation.longitude);
        await fetchNearbyExpensiveStores(currentLocation.latitude, currentLocation.longitude);
      } else {
        // Don't show alert immediately - let user continue without location
        console.log('Location permission not granted, continuing without location features');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      // Don't crash the app if location fails
    }
  };

  useEffect(() => {
    if (location) {
      fetchWeatherData(location.latitude, location.longitude);
      fetchNearbyExpensiveStores(location.latitude, location.longitude);
    }
  }, [location]);

  // Initialize app safely
  useEffect(() => {
    const initializeApp = async () => {
      if (!userData) return;
      
      try {
        setIsInitializing(true);
        // Wait a bit for authentication to settle
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if permissions have been requested
        const hasRequestedPermissions = permissions.location.requested || permissions.healthKit.requested;
        
        if (!hasRequestedPermissions) {
          // Show permissions modal
          setShowPermissionsModal(true);
        } else {
          // Request permissions in background if not already granted
          if (!permissions.location.granted || !permissions.healthKit.granted) {
            console.log('[HomeScreen] Requesting permissions in background...');
            requestAllPermissions().catch(error => {
              console.error('Background permission request failed:', error);
            });
          }
        }
        
        // Try to get location but don't fail if it doesn't work
        handleLocationPermission().catch(error => {
          console.error('Location initialization failed:', error);
        });
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [userData, permissions.location.requested, permissions.healthKit.requested]); // Only run when userData or permissions change

  const handlePermissionsRequest = async () => {
    try {
      await requestAllPermissions();
      setShowPermissionsModal(false);
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const handleSkipPermissions = () => {
    setShowPermissionsModal(false);
  };

  const handleContinueWithoutPermissions = () => {
    setShowPermissionsModal(false);
  };

  // Show loading screen while data is loading or if no real data
  if (loading || isInitializing || permissionsLoading || !userData) {
    return (
      <ScreenContainer>
        <SafeLoadingScreen 
          type="dashboard"
          message="Loading your dashboard..."
          subMessage="Setting up permissions and gathering your latest insights"
        />
      </ScreenContainer>
    );
  }

  const handleConfirmSavings = async (actualAmount: number, originalAmount: number, reason: string) => {
    try {
      const response = await recordSavings({
        amount: actualAmount,
        reason,
        category: 'shopping',
        originalAmount,
        triggerType: 'location_alert',
        metadata: {
          location: location ? { latitude: location.latitude, longitude: location.longitude } : null,
          timestamp: new Date().toISOString(),
        },
      });

      if (response) {
        Alert.alert(
          'Savings Recorded! 🎉',
          `You saved €${(originalAmount - actualAmount).toFixed(2)} by avoiding this purchase!`,
          [{ text: 'Great!', style: 'default' }]
        );
        
        // Refresh savings stats
        await fetchSavingsStats();
      }
    } catch (error) {
      console.error('Error recording savings:', error);
      Alert.alert(
        'Error',
        'Failed to record your savings. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  // Show loading state if userData is not available
  if (loading) {
    return (
      <ScreenContainer>
        <SafeLoadingScreen 
          type="dashboard"
          message="Loading your dashboard..."
          subMessage="Gathering your latest insights and data"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}, {userData?.name || 'User'}</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </View>

      {/* Savings Counter */}
      <SavingsCounter
        totalSaved={savings?.total.amount || 0}
        monthlyTarget={savings?.monthly.target || 100}
        monthlySaved={savings?.monthly.amount || 0}
        onPress={() => {
          // Navigate to subscription screen for now since /savings doesn't exist
          router.push('/subscription');
        }}
        onUpgradePress={() => setShowUpgradeModal(true)}
        userPlan={subscription?.plan as 'free' | 'pro' | 'premium'}
        hasAccess={subscription?.isPro || false}
        style={styles.savingsCounter}
      />

      {/* Weather Card */}
      {weather && (
        <WeatherCard weather={weather} style={styles.weatherCard} />
      )}

      {/* Expensive Store Alert */}
      {nearbyStores && nearbyStores.length > 0 && showStoreAlert && (
        <ExpensiveStoreAlert 
          stores={nearbyStores} 
          onDismiss={() => setShowStoreAlert(false)}
          onConfirmSavings={handleConfirmSavings}
        />
      )}

      <View style={styles.summaryContainer}>
        <MoodPicker initialMood={currentMood} onMoodChange={handleMoodChange} />
        
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <View style={styles.metricHeader}>
              <Moon size={18} color={colors.midnightBlue} />
              <Text style={styles.metricLabel}>Sleep</Text>
            </View>
            <Text style={styles.metricValue}>{userData?.sleepHours || 0} hours</Text>
          </View>
          
          <View style={styles.metricItem}>
            <View style={styles.metricHeader}>
              <Battery size={18} color={colors.midnightBlue} />
              <Text style={styles.metricLabel}>Energy</Text>
            </View>
            <ProgressBar 
              value={userData?.energyLevel || 0} 
              height={6}
              color={colors.lightPurple}
            />
          </View>

          {/* Weather-based mood correlation */}
          {moodCorrelation && (
            <View style={styles.metricItem}>
              <View style={styles.metricHeader}>
                <CloudSun size={18} color={colors.midnightBlue} />
                <Text style={styles.metricLabel}>Weather Impact</Text>
              </View>
              <Text style={styles.metricValue}>
                {moodCorrelation.correlationScore > 0 ? 'Positive' : 
                 moodCorrelation.correlationScore < 0 ? 'Negative' : 'Neutral'}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actionContainer}>
        <InsightCard
          title="Today's Focus"
          description={userData?.suggestedAction || "Take a moment to check in with yourself and set your intentions for the day."}
          variant="info"
        />
        
        {/* Weather-based recommendation */}
        {moodCorrelation && moodCorrelation.recommendations.length > 0 && (
          <InsightCard
            title="Weather Recommendation"
            description={moodCorrelation.recommendations[0]}
            variant="info"
          />
        )}
      </View>

      <View style={styles.startChatContainer}>
        <Button
          title="Start day with Lyra"
          onPress={handleStartChat}
          variant="primary"
          size="large"
          fullWidth
          icon={<MessageCircle size={18} color={colors.white} />}
        />
      </View>

      <View style={styles.recentInsightsContainer}>
        <Text style={styles.sectionTitle}>Recent Insights</Text>
        
        <InsightCard
          title="Sleep Pattern"
          description="Your sleep has been consistent this week. Keep it up!"
          variant="success"
        />
        
        <InsightCard
          title="Mood Observation"
          description="Your mood tends to improve after morning exercise sessions."
          variant="default"
        />
        
        <InsightCard
          title="Energy Management"
          description="Consider taking short breaks between meetings to maintain energy levels."
          variant="warning"
        />
      </View>

      {/* Subscription Upgrade Modal */}
      <SubscriptionUpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureId="savings_tracking"
        featureName="Savings Tracking"
      />

      {/* Permissions Request Modal */}
      <PermissionsRequestModal
        visible={showPermissionsModal}
        permissions={permissions}
        onRequestPermissions={handlePermissionsRequest}
        onSkip={handleSkipPermissions}
        onContinue={handleContinueWithoutPermissions}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray[600],
  },
  header: {
    marginBottom: 24,
  },
  weatherCard: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.midnightBlue,
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: colors.gray[600],
  },
  summaryContainer: {
    marginBottom: 24,
  },
  metricsContainer: {
    marginTop: 16,
    backgroundColor: colors.gray[100],
    borderRadius: 16,
    padding: 16,
  },
  metricItem: {
    marginBottom: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.gray[700],
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.midnightBlue,
  },
  actionContainer: {
    marginBottom: 24,
  },
  startChatContainer: {
    marginBottom: 32,
  },
  recentInsightsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.midnightBlue,
    marginBottom: 16,
  },
  savingsCounter: {
    marginBottom: 16,
  },
});