import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

interface InsightCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'info';
}

export const InsightCard: React.FC<InsightCardProps> = ({
  title,
  description,
  icon,
  variant = 'default',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          container: { backgroundColor: 'rgba(76, 175, 80, 0.1)' },
          title: { color: colors.success },
        };
      case 'warning':
        return {
          container: { backgroundColor: 'rgba(255, 193, 7, 0.1)' },
          title: { color: colors.warning },
        };
      case 'info':
        return {
          container: { backgroundColor: 'rgba(184, 181, 255, 0.2)' },
          title: { color: colors.midnightBlue },
        };
      default:
        return {
          container: { backgroundColor: colors.white },
          title: { color: colors.gray[800] },
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={[styles.container, variantStyles.container]}>
      <View style={styles.header}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={[styles.title, variantStyles.title]}>{title}</Text>
      </View>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: colors.gray[400],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  description: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
  },
});