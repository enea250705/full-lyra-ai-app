import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { GraphView } from '@/components/ui/GraphView';
import { BasicChart } from '@/components/ui/BasicChart';
import { SimpleMoodWeatherChart } from '@/components/ui/SimpleMoodWeatherChart';
import { InsightCard } from '@/components/ui/InsightCard';
import ComprehensiveInsights from '@/components/ui/ComprehensiveInsights';
import { useUserData } from '@/hooks/useUserData';
import { useAuth } from '@/contexts/AuthContext';
import { useMood } from '@/hooks/useMood';
import { useWeatherMood } from '@/hooks/useWeatherMood';
import { useLocation } from '@/hooks/useLocation';
import { colors } from '@/constants/colors';
import { Mood } from '@/types';
import SafeLoadingScreen from '@/components/ui/SafeLoadingScreen';
import { useI18n } from '@/i18n';

export default function InsightsScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { insightData, userData, loading, refreshData } = useUserData();
  const { refreshMoodEntries } = useMood();
  const { comprehensiveData, getComprehensiveData } = useWeatherMood(user?.id || '');
  const { location } = useLocation();
  const [refreshing, setRefreshing] = useState(false);

  // Refresh mood entries when user navigates to insights page
  useFocusEffect(
    React.useCallback(() => {
      refreshMoodEntries();
    }, [refreshMoodEntries])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshMoodEntries(); // Refresh mood entries first
      await refreshData();
    } catch (error) {
      console.error('[InsightsScreen] Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Convert mood to numeric value for graph
  const moodToValue = (mood: Mood): number => {
    switch (mood) {
      case 'terrible': return 2;
      case 'bad': return 4;
      case 'neutral': return 5;
      case 'good': return 7;
      case 'great': return 9;
      default: return 5;
    }
  };

  // Convert mood to label for graph
  const moodToLabel = (mood: Mood): string => {
    switch (mood) {
      case 'terrible': return '😞';
      case 'bad': return '😕';
      case 'neutral': return '😐';
      case 'good': return '😊';
      case 'great': return '😁';
      default: return '😐';
    }
  };

  // Prepare mood data for graph
  const moodData = insightData?.moodTrend?.map(item => ({
    date: item.date,
    value: moodToValue(item.mood),
    label: moodToLabel(item.mood),
  })) || [];

  // Prepare sleep data for graph
  const sleepData = insightData?.sleepData?.map(item => ({
    date: item.date,
    value: item.hours,
    label: `${item.hours}h`,
  })) || [];

  // Prepare weather data for mood-weather chart
  const weatherData = comprehensiveData?.weather ? [{
    date: new Date(),
    temperature: comprehensiveData.weather.temperature,
    weatherType: comprehensiveData.weather.weatherType,
    humidity: comprehensiveData.weather.humidity || 50,
    windSpeed: comprehensiveData.weather.windSpeed || 5,
  }] : [];

  // Trigger comprehensive data fetching when we have mood data and location
  useEffect(() => {
    if (moodData.length > 0 && user?.id && location) {
      // Get the latest mood value
      const latestMood = moodData[0]?.value || 5;
      getComprehensiveData(latestMood, location.latitude, location.longitude);
    }
  }, [moodData.length, user?.id, location, getComprehensiveData]);

  // Show loading state only if still loading and no data at all
  if (loading && !insightData && !userData) {
    return (
      <ScreenContainer>
        <SafeLoadingScreen 
          type="insights"
          message={t('insights.screen.loading_title')}
          subMessage={t('insights.screen.loading_sub')}
        />
      </ScreenContainer>
    );
  }

  // Check if we have any data at all
  const hasAnyData = insightData && (
    (insightData.moodTrend && insightData.moodTrend.length > 0) ||
    (insightData.sleepData && insightData.sleepData.length > 0) ||
    (insightData.wins && insightData.wins.length > 0) ||
    (insightData.lessons && insightData.lessons.length > 0) ||
    (insightData.suggestions && insightData.suggestions.length > 0)
  );

  // Calculate data availability for insights
  const getDataAvailability = () => {
    // Try to get data from the raw API response first, then fall back to transformed data
    const moodCount = insightData?.moodTrend?.length || 0;
    const sleepCount = insightData?.sleepData?.length || 0;
    
    console.log('[InsightsScreen] Data availability calculation:', {
      moodCount,
      sleepCount,
      moodTrend: insightData?.moodTrend,
      sleepData: insightData?.sleepData
    });
    
    return {
      mood: { current: moodCount, needed: 7, ready: moodCount >= 7 },
      sleep: { current: sleepCount, needed: 7, ready: sleepCount >= 7 },
      weather: { current: Math.min(moodCount, sleepCount), needed: 14, ready: Math.min(moodCount, sleepCount) >= 14 }
    };
  };

  const dataAvailability = getDataAvailability();

  return (
    <ScreenContainer onRefresh={handleRefresh} refreshing={refreshing}>
      <Text style={styles.title}>{t('insights.screen.title')}</Text>
      <Text style={styles.subtitle}>
        {t('insights.screen.subtitle')}
      </Text>

      {/* Weather & Location Insights - Always show when user data exists */}
      {userData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('insights.screen.weather_location')}</Text>
          <ComprehensiveInsights userId={user?.id || ''} />
          
          {/* Mood & Weather Correlation Chart */}
          {moodData.length > 0 && (
            <SimpleMoodWeatherChart
              moodData={moodData}
              weatherData={weatherData}
              title="Mood & Weather Analysis"
            />
          )}
        </View>
      )}

      {/* Empty State with Progress - Only show when no insight data */}
      {!hasAnyData && !loading && (
        <View style={styles.emptyStateSection}>
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No insights data available yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start tracking your mood, sleep, and activities to see personalized insights here.
            </Text>
          </View>
          
          {/* Progress to Insights */}
          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>Progress to Insights</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>Mood Tracking</Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${Math.min(100, (dataAvailability.mood.current / dataAvailability.mood.needed) * 100)}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {dataAvailability.mood.current}/{dataAvailability.mood.needed} days
                </Text>
              </View>
              
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>Sleep Tracking</Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${Math.min(100, (dataAvailability.sleep.current / dataAvailability.sleep.needed) * 100)}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {dataAvailability.sleep.current}/{dataAvailability.sleep.needed} days
                </Text>
              </View>
              
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>Weather-Mood Analysis</Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${Math.min(100, (dataAvailability.weather.current / dataAvailability.weather.needed) * 100)}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {dataAvailability.weather.current}/{dataAvailability.weather.needed} days
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Main Insights Content - Only show when we have insight data */}
      {hasAnyData && (
        <>
          {/* Mood Trends */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('insights.screen.mood_trend')}</Text>
            {moodData.length > 0 ? (
              <BasicChart
                data={moodData}
                title="Mood Trends"
                subtitle="Your emotional journey over time"
                maxValue={10}
                minValue={1}
                chartType="line"
                gradientColors={['#667eea', '#764ba2']}
              />
            ) : (
              <View style={styles.emptyDataContainer}>
                <Text style={styles.emptyDataText}>{t('insights.screen.no_mood_data')}</Text>
                <Text style={styles.emptyDataSubtext}>{t('insights.screen.start_tracking_mood')}</Text>
              </View>
            )}
          </View>

          {/* Sleep Tracker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('insights.screen.sleep_tracker')}</Text>
            {sleepData.length > 0 ? (
              <BasicChart
                data={sleepData}
                title="Sleep Patterns"
                subtitle="Your sleep duration and quality"
                chartType="bar"
                gradientColors={['#4facfe', '#00f2fe']}
              />
            ) : (
              <View style={styles.emptyDataContainer}>
                <Text style={styles.emptyDataText}>{t('insights.screen.no_sleep_data')}</Text>
                <Text style={styles.emptyDataSubtext}>{t('insights.screen.start_logging_sleep')}</Text>
              </View>
            )}
          </View>

          {/* Weekly Reflections */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('insights.screen.weekly_reflections')}</Text>
            
            <View style={styles.reflectionContainer}>
              <Text style={styles.reflectionTitle}>{t('insights.screen.wins_title')}</Text>
              {insightData?.wins && insightData.wins.length > 0 ? (
                insightData.wins.map((win, index) => (
                  <View key={`win-${index}`} style={styles.reflectionItem}>
                    <Text style={styles.reflectionBullet}>•</Text>
                    <Text style={styles.reflectionText}>{win}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.reflectionText}>{t('insights.screen.no_wins')}</Text>
              )}
            </View>
            
            <View style={styles.reflectionContainer}>
              <Text style={styles.reflectionTitle}>{t('insights.screen.lessons_title')}</Text>
              {insightData?.lessons && insightData.lessons.length > 0 ? (
                insightData.lessons.map((lesson, index) => (
                  <View key={`lesson-${index}`} style={styles.reflectionItem}>
                    <Text style={styles.reflectionBullet}>•</Text>
                    <Text style={styles.reflectionText}>{lesson}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.reflectionText}>{t('insights.screen.no_lessons')}</Text>
              )}
            </View>
          </View>

          {/* Actionable Suggestions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('insights.screen.actionable_suggestions')}</Text>
            {insightData?.suggestions && insightData.suggestions.length > 0 ? (
              insightData.suggestions.map((suggestion, index) => (
                <InsightCard
                  key={`suggestion-${index}`}
                  title={t('insights.screen.suggestion_n', { n: String(index + 1) })}
                  description={suggestion}
                  variant={index % 3 === 0 ? 'warning' : index % 3 === 1 ? 'info' : 'success'}
                />
              ))
            ) : (
              <InsightCard
                title={t('insights.screen.getting_started')}
                description={t('insights.screen.getting_started_desc')}
                variant="info"
              />
            )}
          </View>
        </>
      )}
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
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.midnightBlue,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[600],
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  emptyStateSection: {
    marginBottom: 32,
  },
  progressSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.midnightBlue,
    marginBottom: 16,
  },
  reflectionContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.gray[400],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reflectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.midnightBlue,
    marginBottom: 12,
  },
  reflectionItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reflectionBullet: {
    fontSize: 16,
    color: colors.midnightBlue,
    marginRight: 8,
  },
  reflectionText: {
    fontSize: 16,
    color: colors.gray[700],
    flex: 1,
    lineHeight: 22,
  },
  emptyStateContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: colors.gray[400],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.gray[700],
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  emptyDataContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: colors.gray[400],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyDataText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.gray[600],
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyDataSubtext: {
    fontSize: 12,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 16,
  },
  dataRequirementsContainer: {
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  dataRequirementsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.midnightBlue,
    marginBottom: 12,
    textAlign: 'center',
  },
  dataRequirementItem: {
    marginBottom: 8,
  },
  dataRequirementText: {
    fontSize: 13,
    color: colors.gray[700],
    textAlign: 'center',
  },
  progressContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.gray[400],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressItem: {
    marginBottom: 20,
  },
  progressLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.midnightBlue,
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.midnightBlue,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.gray[600],
    textAlign: 'right',
  },
});