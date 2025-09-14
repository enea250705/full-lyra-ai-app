import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { GraphView } from '@/components/ui/GraphView';
import { InsightCard } from '@/components/ui/InsightCard';
import ComprehensiveInsights from '@/components/ui/ComprehensiveInsights';
import { useUserData } from '@/hooks/useUserData';
import { colors } from '@/constants/colors';
import { Mood } from '@/types';
import SafeLoadingScreen from '@/components/ui/SafeLoadingScreen';
import { useI18n } from '@/i18n';

export default function InsightsScreen() {
  const { t } = useI18n();
  const { insightData, userData, loading, refreshData } = useUserData();
  const [refreshing, setRefreshing] = useState(false);

  // Debug logging
  console.log('[InsightsScreen] Debug data:', {
    loading,
    insightData,
    userData,
    hasMoodData: insightData?.moodTrend?.length || 0,
    hasSleepData: insightData?.sleepData?.length || 0,
    hasWins: insightData?.wins?.length || 0,
    hasLessons: insightData?.lessons?.length || 0,
    hasSuggestions: insightData?.suggestions?.length || 0,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
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
      case 'terrible': return 1;
      case 'bad': return 2;
      case 'neutral': return 3;
      case 'good': return 4;
      case 'great': return 5;
      default: return 3;
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

  return (
    <ScreenContainer onRefresh={handleRefresh} refreshing={refreshing}>
      <Text style={styles.title}>{t('insights.screen.title')}</Text>
      <Text style={styles.subtitle}>
        {t('insights.screen.subtitle')}
      </Text>

      {/* Show message if no data available */}
      {!hasAnyData && !loading && (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>No insights data available yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Start tracking your mood, sleep, and activities to see personalized insights here.
          </Text>
        </View>
      )}

      {/* Comprehensive Weather & Location Insights */}
      {userData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('insights.screen.weather_location')}</Text>
          <ComprehensiveInsights userId={userData.name} />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('insights.screen.mood_trend')}</Text>
        {moodData.length > 0 ? (
          <GraphView
            data={moodData}
            title={t('insights.mood_weather.title')}
            maxValue={5}
            minValue={1}
            barColor={colors.lightPurple}
          />
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>{t('insights.screen.no_mood_data')}</Text>
            <Text style={styles.emptyStateSubtext}>{t('insights.screen.start_tracking_mood')}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('insights.screen.sleep_tracker')}</Text>
        {sleepData.length > 0 ? (
          <GraphView
            data={sleepData}
            title={t('insights.screen.hours_of_sleep')}
            yAxisLabel={t('insights.screen.hours')}
            barColor={colors.midnightBlue}
          />
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>{t('insights.screen.no_sleep_data')}</Text>
            <Text style={styles.emptyStateSubtext}>{t('insights.screen.start_logging_sleep')}</Text>
          </View>
        )}
      </View>

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
    marginBottom: 32,
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
  },
});