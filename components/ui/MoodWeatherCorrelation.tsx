import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { TrendingUp, TrendingDown, Minus, Lightbulb } from 'lucide-react-native';

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

const getCorrelationIcon = (score: number) => {
  if (score > 0.2) return <TrendingUp size={24} color="#4CAF50" />;
  if (score < -0.2) return <TrendingDown size={24} color="#FF5722" />;
  return <Minus size={24} color="#FF9800" />;
};

const getCorrelationColor = (score: number) => {
  if (score > 0.2) return '#4CAF50';
  if (score < -0.2) return '#FF5722';
  return '#FF9800';
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

const MoodWeatherCorrelation: React.FC<MoodWeatherCorrelationProps> = ({ 
  correlation, 
  style 
}) => {
  const correlationColor = getCorrelationColor(correlation.correlationScore);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mood & Weather Analysis</Text>
        <View style={styles.correlationBadge}>
          {getCorrelationIcon(correlation.correlationScore)}
          <Text style={[styles.correlationText, { color: correlationColor }]}>
            {getCorrelationText(correlation.correlationScore)}
          </Text>
        </View>
      </View>

      <View style={styles.moodSection}>
        <View style={styles.moodItem}>
          <Text style={styles.moodLabel}>Current Mood</Text>
          <View style={styles.moodValue}>
            <Text style={styles.moodEmoji}>{getMoodEmoji(correlation.mood)}</Text>
            <Text style={styles.moodNumber}>{correlation.mood}/10</Text>
          </View>
        </View>

        <View style={styles.moodItem}>
          <Text style={styles.moodLabel}>Correlation Score</Text>
          <View style={styles.moodValue}>
            <Text style={[styles.scoreNumber, { color: correlationColor }]}>
              {correlation.correlationScore > 0 ? '+' : ''}{correlation.correlationScore}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.predictionSection}>
        <Text style={styles.predictionTitle}>Weather Impact Prediction</Text>
        <Text style={styles.predictionText}>{correlation.moodPrediction}</Text>
      </View>

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
                <Text style={styles.recommendationBullet}>•</Text>
                <Text style={styles.recommendationText}>{recommendation}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.weatherSummary}>
        <Text style={styles.weatherSummaryTitle}>Weather Factors</Text>
        <View style={styles.weatherFactors}>
          <View style={styles.weatherFactor}>
            <Text style={styles.weatherFactorLabel}>Temperature</Text>
            <Text style={styles.weatherFactorValue}>
              {Math.round(correlation.weather.temperature)}°C
            </Text>
          </View>
          <View style={styles.weatherFactor}>
            <Text style={styles.weatherFactorLabel}>Conditions</Text>
            <Text style={styles.weatherFactorValue}>
              {correlation.weather.weatherType}
            </Text>
          </View>
          <View style={styles.weatherFactor}>
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
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  correlationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  correlationText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  moodSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  moodItem: {
    flex: 1,
    alignItems: 'center',
  },
  moodLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  moodValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  moodNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scoreNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  predictionSection: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  predictionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  recommendationsSection: {
    marginBottom: 20,
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
    fontSize: 16,
    color: '#FFC107',
    marginRight: 8,
    marginTop: 2,
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 18,
  },
  weatherSummary: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 16,
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
  },
  weatherFactor: {
    alignItems: 'center',
    flex: 1,
  },
  weatherFactorLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  weatherFactorValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

export default MoodWeatherCorrelation;