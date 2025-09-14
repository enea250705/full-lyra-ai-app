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
import { useI18n } from '@/i18n';
import { Mood } from '@/types';
import { Moon, Battery, MessageCircle, MapPin, CloudSun } from 'lucide-react-native';
import SafeLoadingScreen from '@/components/ui/SafeLoadingScreen';

export default function HomeScreen() {
  const router = useRouter();
  const { userData, updateUserData, loading } = useUserData();
  const { t } = useI18n();
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
  const { permissions, requestAllPermissions, requestLocationPermission, isLoading: permissionsLoading } = usePermissions();
  
  const [currentMood, setCurrentMood] = useState<Mood>(userData?.mood || 'neutral');
  const [showStoreAlert, setShowStoreAlert] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [permissionsDismissed, setPermissionsDismissed] = useState(false);

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
        console.log('[HomeScreen] Starting app initialization...');
        
        // Wait a bit for authentication to settle
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if all permissions are granted
        const allPermissionsGranted = permissions.location.granted && 
                                     permissions.healthKit.granted && 
                                     permissions.notifications.granted;
        
        console.log('[HomeScreen] Permission status:', {
          location: permissions.location,
          healthKit: permissions.healthKit,
          notifications: permissions.notifications,
          allPermissionsGranted
        });
        
        if (!allPermissionsGranted && !permissionsDismissed) {
          // Show permissions modal if any permission is not granted and user hasn't dismissed it
          console.log('[HomeScreen] Some permissions not granted, showing permissions modal');
          setShowPermissionsModal(true);
        } else {
          console.log('[HomeScreen] All permissions granted or user dismissed modal, skipping modal');
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
  }, [userData, permissions.location.granted, permissions.healthKit.granted, permissions.notifications.granted]); // Run when any permission status changes

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
    setPermissionsDismissed(true);
  };

  const handleContinueWithoutPermissions = () => {
    setShowPermissionsModal(false);
    setPermissionsDismissed(true);
  };

  // Monitor permission changes and update modal
  useEffect(() => {
    if (showPermissionsModal) {
      console.log('[HomeScreen] Permissions modal is visible, current permissions:', permissions);
      
      // Check if all permissions are granted
      const allGranted = permissions.location.granted && permissions.healthKit.granted && permissions.notifications.granted;
      if (allGranted) {
        console.log('[HomeScreen] All permissions granted, closing modal');
        setShowPermissionsModal(false);
      }
    }
  }, [permissions, showPermissionsModal]);

  // Show loading screen while data is loading or if no real data
  if (loading || isInitializing || permissionsLoading || !userData) {
    return (
      <ScreenContainer>
        <SafeLoadingScreen 
          type="dashboard"
          message={t('home.loading_title')}
          subMessage={t('home.loading_subtitle')}
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
        <Text style={styles.greeting}>{t('home.greeting_with_name', { greeting: t('date.good_morning'), name: userData?.name || 'User' })}</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </View>

      {/* Savings Counter */}
      <SavingsCounter
        totalSaved={savings?.total.amount || 0}
        monthlyTarget={savings?.monthly.target || 100}
        monthlySaved={savings?.monthly.amount || 0}
        todaySaved={savings?.today?.amount || 0}
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
              <Text style={styles.metricLabel}>{t('home.sleep_pattern')}</Text>
            </View>
            <Text style={styles.metricValue}>{t('insights.screen.hours_of_sleep')}: {userData?.sleepHours || 0}</Text>
          </View>
          
          <View style={styles.metricItem}>
            <View style={styles.metricHeader}>
              <Battery size={18} color={colors.midnightBlue} />
              <Text style={styles.metricLabel}>{t('home.energy')}</Text>
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
                <Text style={styles.metricLabel}>{t('home.weather_impact')}</Text>
              </View>
              <Text style={styles.metricValue}>
                {moodCorrelation.correlationScore > 0 ? t('home.impact_positive') : 
                 moodCorrelation.correlationScore < 0 ? t('home.impact_negative') : t('home.impact_neutral')}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actionContainer}>
        <InsightCard
          title={t('home.todays_focus')}
          description={userData?.suggestedAction || t('home.default_focus')}
          variant="info"
        />
        
        {/* Weather-based recommendation */}
        {moodCorrelation && moodCorrelation.recommendations.length > 0 && (
          <InsightCard
            title={t('home.weather_recommendation')}
            description={moodCorrelation.recommendations[0]}
            variant="info"
          />
        )}
      </View>

      <View style={styles.startChatContainer}>
        <Button
          title={t('home.start_day_with_lyra')}
          onPress={handleStartChat}
          variant="primary"
          size="large"
          fullWidth
          icon={<MessageCircle size={18} color={colors.white} />}
        />
      </View>

      <View style={styles.recentInsightsContainer}>
        <Text style={styles.sectionTitle}>{t('home.recent_insights')}</Text>
        
        <InsightCard
          title={t('home.sleep_pattern')}
          description={t('home.sleep_pattern_desc')}
          variant="success"
        />
        
        <InsightCard
          title={t('home.mood_observation')}
          description={t('home.mood_observation_desc')}
          variant="default"
        />
        
        <InsightCard
          title={t('home.energy_management')}
          description={t('home.energy_management_desc')}
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