import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '../../constants/colors';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = colors.lightPurple 
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    spinAnimation.start();

    return () => spinAnimation.stop();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'medium':
        return 24;
      case 'large':
        return 32;
      default:
        return 24;
    }
  };

  const spinnerSize = getSize();
  const borderWidth = Math.max(2, spinnerSize / 8);

  return (
    <Animated.View
      style={[
        styles.spinner,
        {
          width: spinnerSize,
          height: spinnerSize,
          borderWidth,
          borderColor: `${color}20`,
          borderTopColor: color,
          transform: [{ rotate: spin }],
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  spinner: {
    borderRadius: 50,
  },
});

export default LoadingSpinner;