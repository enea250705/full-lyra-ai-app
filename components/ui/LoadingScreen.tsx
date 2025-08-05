import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '../../constants/colors';
import { Brain, Sparkles, Heart, Moon, TrendingUp, Calendar } from 'lucide-react-native';

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
  type?: 'default' | 'auth' | 'dashboard' | 'insights' | 'chat' | 'settings' | 'sleep';
  size?: 'small' | 'medium' | 'large';
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading...', 
  subMessage,
  type = 'default',
  size = 'large'
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Spinning animation
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Pulsing animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Fade in animation
    const fadeAnimation = Animated.timing(fadeValue, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });

    // Scale animation
    const scaleAnimation = Animated.spring(scaleValue, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    });

    spinAnimation.start();
    pulseAnimation.start();
    fadeAnimation.start();
    scaleAnimation.start();

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulseOpacity = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const pulseScale = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.05],
  });

  const getIcon = () => {
    const iconSize = size === 'small' ? 32 : size === 'medium' ? 48 : 64;
    const iconColor = colors.lightPurple;

    switch (type) {
      case 'auth':
        return <Heart size={iconSize} color={iconColor} />;
      case 'dashboard':
        return <TrendingUp size={iconSize} color={iconColor} />;
      case 'insights':
        return <Brain size={iconSize} color={iconColor} />;
      case 'chat':
        return <Sparkles size={iconSize} color={iconColor} />;
      case 'settings':
        return <Brain size={iconSize} color={iconColor} />;
      case 'sleep':
        return <Moon size={iconSize} color={iconColor} />;
      default:
        return <Sparkles size={iconSize} color={iconColor} />;
    }
  };

  const getGradientColors = () => {
    switch (type) {
      case 'auth':
        return [colors.lightPurple, colors.midnightBlue];
      case 'dashboard':
        return [colors.softLavender, colors.lightPurple];
      case 'insights':
        return [colors.lightPurple, colors.deepPurple];
      case 'chat':
        return [colors.softLavender, colors.lightPurple];
      case 'sleep':
        return [colors.midnightBlue, colors.deepPurple];
      default:
        return [colors.softLavender, colors.lightPurple];
    }
  };

  const containerStyle = size === 'small' ? styles.smallContainer : 
                        size === 'medium' ? styles.mediumContainer : styles.container;

  return (
    <Animated.View 
      style={[
        containerStyle, 
        { 
          opacity: fadeValue,
          transform: [{ scale: scaleValue }]
        }
      ]}
    >
      {/* Background Gradient Effect - Commented out as CSS gradients don't work in RN */}
      {/* <View style={styles.backgroundGradient} /> */}
      
      {/* Outer Pulse Ring */}
      <Animated.View 
        style={[
          styles.pulseRing,
          {
            opacity: pulseOpacity,
            transform: [{ scale: pulseScale }]
          }
        ]}
      />
      
      {/* Main Loading Circle */}
      <Animated.View 
        style={[
          styles.loadingCircle,
          size === 'small' ? styles.smallCircle : 
          size === 'medium' ? styles.mediumCircle : styles.largeCircle,
          { 
            transform: [{ rotate: spin }] 
          }
        ]}
      >
        {/* Inner Icon */}
        <View style={styles.iconContainer}>
          {getIcon()}
        </View>
      </Animated.View>

      {/* Loading Dots */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                opacity: pulseValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
                transform: [{
                  scale: pulseValue.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.7, 1.2, 0.7],
                  })
                }]
              }
            ]}
          />
        ))}
      </View>

      {/* Loading Text */}
      <View style={styles.textContainer}>
        <Text style={[
          styles.loadingText,
          size === 'small' ? styles.smallText : 
          size === 'medium' ? styles.mediumText : styles.largeText
        ]}>
          {message}
        </Text>
        {subMessage && (
          <Text style={[
            styles.subText,
            size === 'small' ? styles.smallSubText : styles.mediumSubText
          ]}>
            {subMessage}
          </Text>
        )}
      </View>

      {/* Floating Particles */}
      <View style={styles.particlesContainer}>
        {[...Array(6)].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                left: `${15 + (index * 12)}%`,
                opacity: pulseValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 0.8],
                }),
                transform: [{
                  translateY: pulseValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10],
                  })
                }]
              }
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    position: 'relative',
  },
  mediumContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    position: 'relative',
  },
  smallContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    position: 'relative',
  },
  // backgroundGradient: {
  //   ...StyleSheet.absoluteFillObject,
  //   background: `radial-gradient(circle, ${colors.softLavender}20 0%, transparent 70%)`,
  //   opacity: 0.3,
  // },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: `${colors.lightPurple}40`,
  },
  loadingCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 50,
    shadowColor: colors.lightPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: `${colors.lightPurple}30`,
  },
  largeCircle: {
    width: 100,
    height: 100,
  },
  mediumCircle: {
    width: 80,
    height: 80,
  },
  smallCircle: {
    width: 60,
    height: 60,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.lightPurple,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  loadingText: {
    color: colors.midnightBlue,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  largeText: {
    fontSize: 20,
  },
  mediumText: {
    fontSize: 18,
  },
  smallText: {
    fontSize: 16,
  },
  subText: {
    color: colors.gray[600],
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  mediumSubText: {
    fontSize: 14,
  },
  smallSubText: {
    fontSize: 12,
  },
  particlesContainer: {
    position: 'absolute',
    top: '20%',
    left: 0,
    right: 0,
    height: 100,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.lightPurple,
  },
});

export default LoadingScreen;