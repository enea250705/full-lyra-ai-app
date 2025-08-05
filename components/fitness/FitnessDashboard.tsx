import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useGoogleFit, useGoogleFitDashboard } from '../../hooks/useGoogleFit';
import { ProgressBar } from '../ui/ProgressBar';
import { InsightCard } from '../ui/InsightCard';
import { colors } from '../../constants/colors';
import LoadingScreen from '../ui/LoadingScreen';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: string;
  progress?: number;
  color: string;
  onPress?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  unit, 
  icon, 
  progress, 
  color, 
  onPress 
}) => (
  <Pressable style={styles.metricCard} onPress={onPress}>
    <LinearGradient
      colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
      style={styles.metricGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.metricHeader}>
        <Ionicons name={icon as any} size={20} color={color} />
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      
      <View style={styles.metricValue}>
        <Text style={styles.metricNumber}>{value}</Text>
        {unit && <Text style={styles.metricUnit}>{unit}</Text>}
      </View>
      
      {progress !== undefined && (
        <ProgressBar 
          value={progress} 
          height={4} 
          color={color}
          backgroundColor="rgba(255, 255, 255, 0.1)"
        />
      )}
    </LinearGradient>
  </Pressable>
);

interface ActivityCardProps {
  activity: {
    activityType: string;
    startTime: string;
    durationMinutes: number;
    calories?: number;
  };
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  const getActivityIcon = (type: string) => {
    const activityType = type.toLowerCase();
    if (activityType.includes('running')) return 'walk';
    if (activityType.includes('cycling')) return 'bicycle';
    if (activityType.includes('swimming')) return 'water';
    if (activityType.includes('walking')) return 'walk';
    return 'fitness';
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <View style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <View style={styles.activityIconContainer}>
          <Ionicons name={getActivityIcon(activity.activityType)} size={16} color={colors.lightPurple} />
        </View>
        <View style={styles.activityInfo}>
          <Text style={styles.activityType}>{activity.activityType}</Text>
          <Text style={styles.activityTime}>
            {new Date(activity.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.activityStats}>
          <Text style={styles.activityDuration}>{formatDuration(activity.durationMinutes)}</Text>
          {activity.calories && (
            <Text style={styles.activityCalories}>{activity.calories} cal</Text>
          )}
        </View>
      </View>
    </View>
  );
};

export const FitnessDashboard: React.FC = () => {
  const { isConnected } = useGoogleFit();
  const { dashboardData, loading, error, refetch } = useGoogleFitDashboard();

  useEffect(() => {
    if (isConnected) {
      refetch();
    }
  }, [isConnected, refetch]);

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <InsightCard
          title="Connect Google Fit"
          description="Connect your Google Fit account to see your fitness data, including steps, heart rate, activities, and more."
          variant="info"
        />
      </View>
    );
  }

  if (loading) {
    return (
      <LoadingScreen 
        type="dashboard"
        size="medium"
        message="Loading your fitness data..."
        subMessage="Syncing with Google Fit and Apple Health"
      />
    );
  }

  if (error || !dashboardData) {
    return (
      <View style={styles.container}>
        <InsightCard
          title="Unable to load fitness data"
          description="There was an issue loading your Google Fit data. Please try syncing again."
          variant="warning"
        />
      </View>
    );
  }

  const { today, weekly, latest, syncHealth } = dashboardData;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Today's Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Activity</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Steps"
            value={today.steps.toLocaleString()}
            icon="walk"
            progress={today.stepsGoalProgress}
            color="#4CAF50"
          />
          <MetricCard
            title="Distance"
            value={today.distance.toFixed(1)}
            unit="km"
            icon="location"
            color="#2196F3"
          />
          <MetricCard
            title="Calories"
            value={today.calories}
            unit="cal"
            icon="flame"
            color="#FF5722"
          />
          <MetricCard
            title="Heart Rate"
            value={today.averageHeartRate || '--'}
            unit="bpm"
            icon="heart"
            color="#E91E63"
          />
        </View>
      </View>

      {/* Weekly Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Overview</Text>
        <View style={styles.weeklyContainer}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.weeklyCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.weeklyMetric}>
              <Text style={styles.weeklyLabel}>Average Steps</Text>
              <Text style={styles.weeklyValue}>{weekly.averageSteps.toLocaleString()}</Text>
            </View>
            
            {weekly.activityStats && (
              <>
                <View style={styles.weeklyMetric}>
                  <Text style={styles.weeklyLabel}>Total Workouts</Text>
                  <Text style={styles.weeklyValue}>{weekly.activityStats.totalActivities}</Text>
                </View>
                
                <View style={styles.weeklyMetric}>
                  <Text style={styles.weeklyLabel}>Total Duration</Text>
                  <Text style={styles.weeklyValue}>
                    {Math.floor(weekly.activityStats.totalDuration / 60)}h {weekly.activityStats.totalDuration % 60}m
                  </Text>
                </View>
                
                {weekly.activityStats.mostFrequentActivity && (
                  <View style={styles.weeklyMetric}>
                    <Text style={styles.weeklyLabel}>Favorite Activity</Text>
                    <Text style={styles.weeklyValue}>{weekly.activityStats.mostFrequentActivity}</Text>
                  </View>
                )}
              </>
            )}
          </LinearGradient>
        </View>
      </View>

      {/* Recent Activities */}
      {latest.activities && latest.activities.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <View style={styles.activitiesContainer}>
            {latest.activities.slice(0, 3).map((activity, index) => (
              <ActivityCard key={index} activity={activity} />
            ))}
          </View>
        </View>
      )}

      {/* Weight Tracking */}
      {latest.weight && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Weight</Text>
          <View style={styles.weightContainer}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.weightCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.weightHeader}>
                <Ionicons name="scale" size={20} color="#9C27B0" />
                <Text style={styles.weightTitle}>Weight</Text>
              </View>
              
              <View style={styles.weightMetrics}>
                <View style={styles.weightMetric}>
                  <Text style={styles.weightValue}>{latest.weight.weightKg} kg</Text>
                  <Text style={styles.weightLabel}>Weight</Text>
                </View>
                
                {latest.weight.bodyFatPercentage && (
                  <View style={styles.weightMetric}>
                    <Text style={styles.weightValue}>{latest.weight.bodyFatPercentage}%</Text>
                    <Text style={styles.weightLabel}>Body Fat</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.weightDate}>
                Recorded {new Date(latest.weight.timestamp).toLocaleDateString()}
              </Text>
            </LinearGradient>
          </View>
        </View>
      )}

      {/* Sync Health Status */}
      {syncHealth && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync Status</Text>
          <View style={styles.syncContainer}>
            <LinearGradient
              colors={[
                syncHealth.status === 'healthy' 
                  ? 'rgba(76, 175, 80, 0.15)' 
                  : syncHealth.status === 'degraded'
                    ? 'rgba(255, 152, 0, 0.15)'
                    : 'rgba(244, 67, 54, 0.15)',
                'rgba(255, 255, 255, 0.05)'
              ]}
              style={styles.syncCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.syncHeader}>
                <Ionicons 
                  name={
                    syncHealth.status === 'healthy' ? 'checkmark-circle' :
                    syncHealth.status === 'degraded' ? 'warning' : 'alert-circle'
                  } 
                  size={20} 
                  color={
                    syncHealth.status === 'healthy' ? '#4CAF50' :
                    syncHealth.status === 'degraded' ? '#FF9800' : '#F44336'
                  } 
                />
                <Text style={styles.syncTitle}>
                  {syncHealth.status.charAt(0).toUpperCase() + syncHealth.status.slice(1)} Sync
                </Text>
              </View>
              
              <Text style={styles.syncRate}>
                Success Rate: {syncHealth.successRate}%
              </Text>
              
              {syncHealth.lastFullSync && (
                <Text style={styles.syncDate}>
                  Last synced: {new Date(syncHealth.lastFullSync).toLocaleDateString()}
                </Text>
              )}
            </LinearGradient>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.lightGray,
    textAlign: 'center',
    marginTop: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
  },
  metricGradient: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    color: colors.lightGray,
    marginLeft: 8,
  },
  metricValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  metricUnit: {
    fontSize: 14,
    color: colors.lightGray,
    marginLeft: 4,
  },
  weeklyContainer: {
    marginBottom: 8,
  },
  weeklyCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  weeklyMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weeklyLabel: {
    fontSize: 14,
    color: colors.lightGray,
  },
  weeklyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  activitiesContainer: {
    gap: 8,
  },
  activityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(156, 39, 176, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  activityTime: {
    fontSize: 12,
    color: colors.lightGray,
  },
  activityStats: {
    alignItems: 'flex-end',
  },
  activityDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.lightPurple,
  },
  activityCalories: {
    fontSize: 12,
    color: colors.lightGray,
  },
  weightContainer: {
    marginBottom: 8,
  },
  weightCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  weightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginLeft: 8,
  },
  weightMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weightMetric: {
    alignItems: 'center',
  },
  weightValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#9C27B0',
  },
  weightLabel: {
    fontSize: 12,
    color: colors.lightGray,
    marginTop: 4,
  },
  weightDate: {
    fontSize: 12,
    color: colors.lightGray,
    textAlign: 'center',
  },
  syncContainer: {
    marginBottom: 8,
  },
  syncCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  syncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  syncTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginLeft: 8,
  },
  syncRate: {
    fontSize: 14,
    color: colors.lightGray,
    marginBottom: 4,
  },
  syncDate: {
    fontSize: 12,
    color: colors.lightGray,
  },
}); 