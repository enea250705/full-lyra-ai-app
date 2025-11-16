import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { formatShortDate } from '@/utils/dateUtils';
import { TrendingUp, TrendingDown, Minus, Cloud, Sun, CloudRain, Wind, Thermometer, Eye } from 'lucide-react-native';

interface MoodWeatherDataPoint {
  date: Date;
  mood: number;
  temperature: number;
  weatherType: string;
  humidity: number;
  windSpeed: number;
}

interface SimpleMoodWeatherChartProps {
  moodData: Array<{ date: Date; value: number; label?: string }>;
  weatherData: Array<{ date: Date; temperature: number; weatherType: string; humidity: number; windSpeed: number }>;
  title?: string;
  style?: any;
}

const getWeatherIcon = (weatherType: string) => {
  switch (weatherType.toLowerCase()) {
    case 'sunny':
    case 'clear':
      return <Sun size={16} color="#FFA726" />;
    case 'cloudy':
    case 'overcast':
      return <Cloud size={16} color="#90A4AE" />;
    case 'rainy':
    case 'rain':
      return <CloudRain size={16} color="#42A5F5" />;
    default:
      return <Cloud size={16} color="#90A4AE" />;
  }
};

const getMoodColor = (mood: number) => {
  if (mood >= 8) return '#4CAF50';
  if (mood >= 6) return '#8BC34A';
  if (mood >= 4) return '#FF9800';
  if (mood >= 2) return '#FF5722';
  return '#F44336';
};

const getMoodEmoji = (mood: number) => {
  if (mood >= 8) return '😊';
  if (mood >= 6) return '🙂';
  if (mood >= 4) return '😐';
  if (mood >= 2) return '😞';
  return '😢';
};

export const SimpleMoodWeatherChart: React.FC<SimpleMoodWeatherChartProps> = ({
  moodData,
  weatherData,
  title = "Mood & Weather Analysis",
  style,
}) => {
  const [activeTab, setActiveTab] = useState<'mood' | 'weather' | 'correlation'>('mood');
  const { width: screenWidth } = Dimensions.get('window');
  const chartWidth = Math.max(moodData.length * 60, screenWidth - 40);

  // Combine mood and weather data
  const combinedData = moodData.map((moodPoint, index) => {
    const weatherPoint = weatherData.find(w => 
      Math.abs(new Date(w.date).getTime() - new Date(moodPoint.date).getTime()) < 24 * 60 * 60 * 1000
    );
    
    return {
      date: moodPoint.date,
      mood: moodPoint.value,
      temperature: weatherPoint?.temperature || 20,
      weatherType: weatherPoint?.weatherType || 'clear',
      humidity: weatherPoint?.humidity || 50,
      windSpeed: weatherPoint?.windSpeed || 5,
    };
  });

  const getMoodHeight = (mood: number) => {
    return (mood / 10) * 80; // Scale mood (1-10) to height (0-80)
  };

  const getTemperatureHeight = (temp: number) => {
    const normalizedTemp = Math.max(0, Math.min(40, temp)); // Clamp between 0-40°C
    return (normalizedTemp / 40) * 80; // Scale to height
  };

  const renderMoodChart = () => {
    if (moodData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No mood data available</Text>
        </View>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.chartContainer, { width: chartWidth }]}
      >
        {combinedData.map((point, index) => (
          <View key={index} style={styles.dataPointContainer}>
            {/* Mood bar */}
            <View style={styles.barWrapper}>
              <LinearGradient
                colors={[getMoodColor(point.mood), getMoodColor(point.mood) + '80']}
                style={[
                  styles.moodBar,
                  {
                    height: getMoodHeight(point.mood),
                  },
                ]}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
              />
            </View>
            
            {/* Weather icon */}
            <View style={styles.weatherIconContainer}>
              {getWeatherIcon(point.weatherType)}
            </View>
            
            {/* Date label */}
            <Text style={styles.dateLabel}>{formatShortDate(point.date)}</Text>
            
            {/* Mood value */}
            <View style={styles.valueContainer}>
              <Text style={styles.moodEmoji}>{getMoodEmoji(point.mood)}</Text>
              <Text style={styles.moodValue}>{point.mood.toFixed(1)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderWeatherChart = () => {
    if (weatherData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>Weather data will appear here</Text>
          <Text style={styles.emptySubtext}>Enable location services to see weather data</Text>
        </View>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.chartContainer, { width: chartWidth }]}
      >
        {combinedData.map((point, index) => (
          <View key={index} style={styles.dataPointContainer}>
            {/* Temperature bar */}
            <View style={styles.barWrapper}>
              <LinearGradient
                colors={['#FF5722', '#FF9800']}
                style={[
                  styles.temperatureBar,
                  {
                    height: getTemperatureHeight(point.temperature),
                  },
                ]}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
              />
            </View>
            
            {/* Weather details */}
            <View style={styles.weatherDetails}>
              {getWeatherIcon(point.weatherType)}
              <Text style={styles.temperatureValue}>{point.temperature.toFixed(0)}°</Text>
            </View>
            
            {/* Date label */}
            <Text style={styles.dateLabel}>{formatShortDate(point.date)}</Text>
            
            {/* Additional weather info */}
            <View style={styles.weatherInfoContainer}>
              <View style={styles.weatherMetric}>
                <Wind size={12} color="#666" />
                <Text style={styles.weatherMetricText}>{point.windSpeed}m/s</Text>
              </View>
              <View style={styles.weatherMetric}>
                <Eye size={12} color="#666" />
                <Text style={styles.weatherMetricText}>{point.humidity}%</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderCorrelationChart = () => {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.chartContainer, { width: chartWidth }]}
      >
        {combinedData.map((point, index) => {
          const moodHeight = getMoodHeight(point.mood);
          const tempHeight = getTemperatureHeight(point.temperature);
          const correlationStrength = Math.abs(moodHeight - tempHeight) / 80;
          
          return (
            <View key={index} style={styles.dataPointContainer}>
              {/* Correlation indicator */}
              <View style={styles.correlationContainer}>
                <View style={[
                  styles.correlationBar,
                  {
                    height: Math.min(moodHeight, tempHeight),
                    backgroundColor: correlationStrength < 0.3 ? '#4CAF50' : correlationStrength < 0.6 ? '#FF9800' : '#F44336',
                  }
                ]} />
                <View style={[
                  styles.correlationIndicator,
                  {
                    backgroundColor: correlationStrength < 0.3 ? '#4CAF50' : correlationStrength < 0.6 ? '#FF9800' : '#F44336',
                  }
                ]} />
              </View>
              
              {/* Date label */}
              <Text style={styles.dateLabel}>{formatShortDate(point.date)}</Text>
              
              {/* Correlation value */}
              <View style={styles.correlationValueContainer}>
                <Text style={[
                  styles.correlationValue,
                  {
                    color: correlationStrength < 0.3 ? '#4CAF50' : correlationStrength < 0.6 ? '#FF9800' : '#F44336',
                  }
                ]}>
                  {(1 - correlationStrength).toFixed(2)}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderChart = () => {
    switch (activeTab) {
      case 'mood':
        return renderMoodChart();
      case 'weather':
        return renderWeatherChart();
      case 'correlation':
        return renderCorrelationChart();
      default:
        return renderMoodChart();
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        
        {/* Improved Tab Container */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'mood' && styles.activeTab]}
            onPress={() => setActiveTab('mood')}
          >
            <Text style={[styles.tabText, activeTab === 'mood' && styles.activeTabText]}>
              Mood
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'weather' && styles.activeTab]}
            onPress={() => setActiveTab('weather')}
          >
            <Text style={[styles.tabText, activeTab === 'weather' && styles.activeTabText]}>
              Weather
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'correlation' && styles.activeTab]}
            onPress={() => setActiveTab('correlation')}
          >
            <Text style={[styles.tabText, activeTab === 'correlation' && styles.activeTabText]}>
              Correlation
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartWrapper}>
        {renderChart()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[800],
    marginBottom: 16,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    minHeight: 48,
    justifyContent: 'space-between',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[600],
    textAlign: 'center',
  },
  activeTabText: {
    color: colors.midnightBlue,
    fontWeight: '700',
  },
  chartWrapper: {
    height: 160,
  },
  chartContainer: {
    paddingVertical: 16,
    alignItems: 'flex-end',
  },
  dataPointContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: 50,
  },
  barWrapper: {
    height: 80,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  moodBar: {
    width: 20,
    borderRadius: 10,
    minHeight: 4,
  },
  temperatureBar: {
    width: 20,
    borderRadius: 10,
    minHeight: 4,
  },
  weatherIconContainer: {
    marginBottom: 4,
  },
  weatherDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  temperatureValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[700],
    marginLeft: 4,
  },
  dateLabel: {
    fontSize: 10,
    color: colors.gray[600],
    marginBottom: 4,
    textAlign: 'center',
  },
  valueContainer: {
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  moodValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[700],
  },
  weatherInfoContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  weatherMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  weatherMetricText: {
    fontSize: 10,
    color: colors.gray[600],
    marginLeft: 4,
  },
  correlationContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  correlationBar: {
    width: 16,
    borderRadius: 8,
    minHeight: 4,
  },
  correlationIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  correlationValueContainer: {
    alignItems: 'center',
  },
  correlationValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyChart: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[500],
    fontStyle: 'italic',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: colors.gray[400],
    textAlign: 'center',
  },
});

export default SimpleMoodWeatherChart;
