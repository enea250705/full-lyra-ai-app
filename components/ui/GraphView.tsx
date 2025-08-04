import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { colors } from '@/constants/colors';
import { formatShortDate } from '@/utils/dateUtils';

interface DataPoint {
  date: Date;
  value: number;
  label?: string;
}

interface GraphViewProps {
  data: DataPoint[];
  title: string;
  yAxisLabel?: string;
  maxValue?: number;
  minValue?: number;
  barColor?: string;
  showLabels?: boolean;
}

export const GraphView: React.FC<GraphViewProps> = ({
  data,
  title,
  yAxisLabel,
  maxValue: propMaxValue,
  minValue: propMinValue = 0,
  barColor = colors.midnightBlue,
  showLabels = true,
}) => {
  const maxValue = propMaxValue || Math.max(...data.map((d) => d.value));
  const minValue = propMinValue;
  const range = maxValue - minValue;

  const getBarHeight = (value: number) => {
    return ((value - minValue) / range) * 150;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {yAxisLabel && <Text style={styles.yAxisLabel}>{yAxisLabel}</Text>}
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.graphContainer}
      >
        {data.map((point, index) => (
          <View key={index} style={styles.barContainer}>
            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: getBarHeight(point.value),
                    backgroundColor: barColor,
                  },
                ]}
              />
            </View>
            <Text style={styles.dateLabel}>{formatShortDate(point.date)}</Text>
            {showLabels && (
              <Text style={styles.valueLabel}>
                {point.label || point.value.toString()}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.gray[800],
    marginBottom: 16,
  },
  yAxisLabel: {
    fontSize: 12,
    color: colors.gray[500],
    position: 'absolute',
    top: 40,
    left: 8,
    transform: [{ rotate: '-90deg' }],
  },
  graphContainer: {
    paddingVertical: 16,
    alignItems: 'flex-end',
  },
  barContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: 40,
  },
  barWrapper: {
    height: 150,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 20,
    borderRadius: 10,
    minHeight: 4,
  },
  dateLabel: {
    fontSize: 12,
    color: colors.gray[600],
    marginTop: 8,
  },
  valueLabel: {
    fontSize: 12,
    color: colors.gray[700],
    marginTop: 4,
  },
});