import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { formatShortDate } from '@/utils/dateUtils';

interface DataPoint {
  date: Date;
  value: number;
  label?: string;
}

interface BasicChartProps {
  data: DataPoint[];
  title: string;
  subtitle?: string;
  maxValue?: number;
  minValue?: number;
  chartType?: 'line' | 'bar';
  gradientColors?: string[];
  style?: any;
}

export const BasicChart: React.FC<BasicChartProps> = ({
  data,
  title,
  subtitle,
  maxValue: propMaxValue,
  minValue: propMinValue = 0,
  chartType = 'bar',
  gradientColors = ['#667eea', '#764ba2'],
  style,
}) => {
  const { width: screenWidth } = Dimensions.get('window');
  
  // Sort data by date (most recent first) and limit to last 7 entries for better visualization
  const sortedData = [...data]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);
  
  const chartWidth = Math.max(sortedData.length * 60, screenWidth - 40);

  const maxValue = propMaxValue || Math.max(...sortedData.map((d) => d.value));
  const minValue = propMinValue;
  const range = maxValue - minValue;

  const getBarHeight = (value: number) => {
    if (range === 0) return 60;
    return ((value - minValue) / range) * 120;
  };

  const renderBarChart = () => {
    if (sortedData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.chartContainer, { width: chartWidth }]}
      >
        {sortedData.map((point, index) => (
          <View key={index} style={styles.barItem}>
            <View style={styles.barWrapper}>
              <LinearGradient
                colors={gradientColors}
                style={[
                  styles.bar,
                  {
                    height: getBarHeight(point.value),
                  },
                ]}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
              />
            </View>
            <Text style={styles.dateText}>{formatShortDate(point.date)}</Text>
            <Text style={styles.valueText}>
              {point.label || point.value.toFixed(1)}
            </Text>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderLineChart = () => {
    if (sortedData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      );
    }

    const points = sortedData.map((point, index) => {
      const x = (index / Math.max(1, sortedData.length - 1)) * (chartWidth - 40) + 20;
      const y = 120 - getBarHeight(point.value);
      return { x, y, point };
    });

    return (
      <View style={styles.lineChartContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ width: chartWidth }}
        >
          <View style={styles.lineChart}>
            {/* Line segments */}
            {points.map((point, index) => {
              if (index === points.length - 1) return null;
              const nextPoint = points[index + 1];
              const distance = Math.sqrt(
                Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2)
              );
              const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x);
              
              return (
                <View
                  key={`line-${index}`}
                  style={[
                    styles.lineSegment,
                    {
                      left: point.x,
                      top: point.y,
                      width: distance,
                      transform: [{ rotate: `${angle}rad` }],
                    },
                  ]}
                />
              );
            })}
            
            {/* Data points */}
            {points.map((point, index) => (
              <View
                key={`point-${index}`}
                style={[
                  styles.dataPoint,
                  {
                    left: point.x - 6,
                    top: point.y - 6,
                  },
                ]}
              >
                <View style={styles.dataPointInner} />
              </View>
            ))}
            
            {/* Labels */}
            {points.map((point, index) => (
              <View
                key={`label-${index}`}
                style={[
                  styles.labelContainer,
                  {
                    left: point.x - 30,
                    top: 130,
                  },
                ]}
              >
                <Text style={styles.dateText}>{formatShortDate(point.point.date)}</Text>
                <Text style={styles.valueText}>
                  {point.point.label || point.point.value.toFixed(1)}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {/* Chart */}
      <View style={styles.chartWrapper}>
        {chartType === 'line' ? renderLineChart() : renderBarChart()}
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
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray[800],
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 16,
  },
  chartWrapper: {
    height: 180,
  },
  chartContainer: {
    paddingVertical: 16,
    alignItems: 'flex-end',
  },
  barItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: 50,
  },
  barWrapper: {
    height: 120,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 24,
    borderRadius: 12,
    minHeight: 4,
  },
  dateText: {
    fontSize: 10,
    color: colors.gray[600],
    marginTop: 8,
    textAlign: 'center',
  },
  valueText: {
    fontSize: 11,
    color: colors.gray[700],
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
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
  },
  lineChartContainer: {
    flex: 1,
    position: 'relative',
  },
  lineChart: {
    flex: 1,
    position: 'relative',
    height: 140,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#667eea',
    transformOrigin: 'left center',
  },
  dataPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dataPointInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: 60,
  },
});

export default BasicChart;
