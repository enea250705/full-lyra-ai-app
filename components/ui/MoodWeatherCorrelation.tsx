import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { TrendingUp, TrendingDown, Minus, Lightbulb, Thermometer, Cloud, Sun, Wind, Eye } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface MoodWeatherCorrelation {
  mood: number;
  weather: any;
  correlationScore: number;
  moodPrediction: string;
  recommendations: string[];
}

interface MoodWeatherCorrelationProps {
  correlation: MoodWeatherCorrelation;
  style?: any;
}

const getCorrelationGradient = (score: number) => {
  if (score > 0.2) return ['#4CAF50', '#66BB6A']; // Green gradient
  if (score < -0.2) return ['#FF5722', '#FF7043']; // Red gradient
  return ['#FF9800', '#FFB74D']; // Orange gradient
};

const getCorrelationIcon = (score: number) => {
  if (score > 0.2) return <TrendingUp size={20} color="#FFFFFF" />;
  if (score < -0.2) return <TrendingDown size={20} color="#FFFFFF" />;
  return <Minus size={20} color="#FFFFFF" />;
};

const getCorrelationText = (score: number) => {
  if (score > 0.2) return 'Positive Impact';
  if (score < -0.2) return 'Negative Impact';
  return 'Neutral Impact';
};

const getMoodEmoji = (mood: number) => {
  if (mood >= 8) return '😊';
  if (mood >= 6) return '🙂';
  if (mood >= 4) return '😐';
  if (mood >= 2) return '😞';
  return '😢';
};

const getMoodColor = (mood: number) => {
  if (mood >= 8) return '#4CAF50';
  if (mood >= 6) return '#8BC34A';
  if (mood >= 4) return '#FF9800';
  if (mood >= 2) return '#FF5722';
  return '#F44336';
};

const getWeatherIcon = (weatherType: string) => {
  switch (weatherType.toLowerCase()) {
    case 'sunny':
    case 'clear':
      return <Sun size={20} color="#FFA726" />;
    case 'cloudy':
    case 'overcast':
      return <Cloud size={20} color="#90A4AE" />;
    case 'rainy':
    case 'rain':
      return <Cloud size={20} color="#42A5F5" />;
    default:
      return <Cloud size={20} color="#90A4AE" />;
  }
};

const MoodWeatherCorrelation: React.FC<MoodWeatherCorrelationProps> = ({ 
  correlation, 
  style 
}) => {
  const correlationGradient = getCorrelationGradient(correlation.correlationScore);
  const moodColor = getMoodColor(correlation.mood);

  return (
    <View style={[styles.container, style]}>
      {/* Header with gradient background */}
      <LinearGradient
        colors={correlationGradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>Mood & Weather Analysis</Text>
          <View style={styles.correlationBadge}>
            {getCorrelationIcon(correlation.correlationScore)}
            <Text style={styles.correlationText}>
              {getCorrelationText(correlation.correlationScore)}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Mood and Score Section */}
      <View style={styles.moodSection}>
        <View style={styles.moodCard}>
          <Text style={styles.moodLabel}>Current Mood</Text>
          <View style={styles.moodValue}>
            <Text style={styles.moodEmoji}>{getMoodEmoji(correlation.mood)}</Text>
            <Text style={[styles.moodNumber, { color: moodColor }]}>{correlation.mood}/10</Text>
          </View>
        </View>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Correlation</Text>
          <Text style={[styles.scoreNumber, { color: correlationGradient[0] }]}>
            {correlation.correlationScore > 0 ? '+' : ''}{correlation.correlationScore.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Prediction Section */}
      <View style={styles.predictionSection}>
        <Text style={styles.predictionTitle}>Weather Impact Prediction</Text>
        <Text style={styles.predictionText}>{correlation.moodPrediction}</Text>
      </View>

      {/* Recommendations Section */}
      {correlation.recommendations.length > 0 && (
        <View style={styles.recommendationsSection}>
          <View style={styles.recommendationsHeader}>
            <Lightbulb size={20} color="#FFC107" />
            <Text style={styles.recommendationsTitle}>Recommendations</Text>
          </View>
          <ScrollView 
            style={styles.recommendationsList}
            showsVerticalScrollIndicator={false}
          >
            {correlation.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.recommendationItem}>
                <View style={styles.recommendationBullet}>
                  <Text style={styles.recommendationBulletText}>•</Text>
                </View>
                <Text style={styles.recommendationText}>{recommendation}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Weather Summary Section */}
      <View style={styles.weatherSummary}>
        <Text style={styles.weatherSummaryTitle}>Weather Factors</Text>
        <View style={styles.weatherFactors}>
          <View style={styles.weatherFactor}>
            <View style={styles.weatherFactorIcon}>
              <Thermometer size={16} color="#FF5722" />
            </View>
            <Text style={styles.weatherFactorLabel}>Temperature</Text>
            <Text style={styles.weatherFactorValue}>
              {Math.round(correlation.weather.temperature)}°C
            </Text>
          </View>
          
          <View style={styles.weatherFactor}>
            <View style={styles.weatherFactorIcon}>
              {getWeatherIcon(correlation.weather.weatherType)}
            </View>
            <Text style={styles.weatherFactorLabel}>Conditions</Text>
            <Text style={styles.weatherFactorValue}>
              {correlation.weather.weatherType}
            </Text>
          </View>
          
          <View style={styles.weatherFactor}>
            <View style={styles.weatherFactorIcon}>
              <Cloud size={16} color="#90A4AE" />
            </View>
            <Text style={styles.weatherFactorLabel}>Cloudiness</Text>
            <Text style={styles.weatherFactorValue}>
              {correlation.weather.cloudiness}%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  correlationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  correlationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  moodSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  moodCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  moodLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  moodValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 28,
    marginRight: 8,
  },
  moodNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  scoreNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  predictionSection: {
    backgroundColor: '#F0F7FF',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  predictionText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
  recommendationsSection: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  recommendationsList: {
    maxHeight: 120,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationBullet: {
    width: 20,
    alignItems: 'center',
  },
  recommendationBulletText: {
    fontSize: 16,
    color: '#FFC107',
    fontWeight: 'bold',
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 18,
  },
  weatherSummary: {
    backgroundColor: '#F5F5F5',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  weatherSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  weatherFactors: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  weatherFactor: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
  },
  weatherFactorIcon: {
    marginBottom: 6,
  },
  weatherFactorLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textAlign: 'center',
  },
  weatherFactorValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});

export default MoodWeatherCorrelation;