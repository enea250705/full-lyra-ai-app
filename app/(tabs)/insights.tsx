import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { GraphView } from '@/components/ui/GraphView';
import { InsightCard } from '@/components/ui/InsightCard';
import ComprehensiveInsights from '@/components/ui/ComprehensiveInsights';
import { useUserData } from '@/hooks/useUserData';
import { colors } from '@/constants/colors';
import { Mood } from '@/types';

export default function InsightsScreen() {
  const { insightData, userData, loading } = useUserData();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
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

  // Show loading state if data is not available
  if (loading || !insightData) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your insights...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer onRefresh={handleRefresh} refreshing={refreshing}>
      <Text style={styles.title}>Your Insights</Text>
      <Text style={styles.subtitle}>
        Patterns and trends from your daily activities
      </Text>

      {/* Comprehensive Weather & Location Insights */}
      {userData?.id && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weather & Location Insights</Text>
          <ComprehensiveInsights userId={userData.id} />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mood Trend (7 Days)</Text>
        {moodData.length > 0 ? (
          <GraphView
            data={moodData}
            title="Mood"
            maxValue={5}
            minValue={1}
            barColor={colors.lightPurple}
          />
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No mood data available yet.</Text>
            <Text style={styles.emptyStateSubtext}>Start tracking your daily mood to see trends!</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sleep Tracker</Text>
        {sleepData.length > 0 ? (
          <GraphView
            data={sleepData}
            title="Hours of Sleep"
            yAxisLabel="Hours"
            barColor={colors.midnightBlue}
          />
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No sleep data available yet.</Text>
            <Text style={styles.emptyStateSubtext}>Start logging your sleep to see patterns!</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Reflections</Text>
        
        <View style={styles.reflectionContainer}>
          <Text style={styles.reflectionTitle}>3 Wins</Text>
          {insightData?.wins?.length > 0 ? (
            insightData.wins.map((win, index) => (
              <View key={`win-${index}`} style={styles.reflectionItem}>
                <Text style={styles.reflectionBullet}>•</Text>
                <Text style={styles.reflectionText}>{win}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.reflectionText}>No wins recorded yet. Start tracking your daily activities!</Text>
          )}
        </View>
        
        <View style={styles.reflectionContainer}>
          <Text style={styles.reflectionTitle}>3 Lessons</Text>
          {insightData?.lessons?.length > 0 ? (
            insightData.lessons.map((lesson, index) => (
              <View key={`lesson-${index}`} style={styles.reflectionItem}>
                <Text style={styles.reflectionBullet}>•</Text>
                <Text style={styles.reflectionText}>{lesson}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.reflectionText}>No lessons recorded yet. Continue your journey to unlock insights!</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actionable Suggestions</Text>
        {insightData?.suggestions?.length > 0 ? (
          insightData.suggestions.map((suggestion, index) => (
            <InsightCard
              key={`suggestion-${index}`}
              title={`Suggestion ${index + 1}`}
              description={suggestion}
              variant={index % 3 === 0 ? 'warning' : index % 3 === 1 ? 'info' : 'success'}
            />
          ))
        ) : (
          <InsightCard
            title="Getting Started"
            description="Start tracking your mood, sleep, and daily activities to receive personalized suggestions!"
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