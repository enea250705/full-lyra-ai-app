import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { colors } from '../../constants/colors';
import { Brain, Sparkles, Heart, Moon, TrendingUp, Settings } from 'lucide-react-native';

interface SafeLoadingScreenProps {
  message?: string;
  subMessage?: string;
  type?: 'default' | 'auth' | 'dashboard' | 'insights' | 'chat' | 'settings' | 'sleep';
  size?: 'small' | 'medium' | 'large';
}

const SafeLoadingScreen: React.FC<SafeLoadingScreenProps> = ({ 
  message = 'Loading...', 
  subMessage,
  type = 'default',
  size = 'large'
}) => {
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fadeAnimation = Animated.timing(fadeValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    });

    fadeAnimation.start();
  }, []);

  const getIcon = () => {
    const iconSize = size === 'small' ? 32 : size === 'medium' ? 48 : 64;
    const iconColor = colors.lightPurple;

    try {
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
          return <Settings size={iconSize} color={iconColor} />;
        case 'sleep':
          return <Moon size={iconSize} color={iconColor} />;
        default:
          return <Sparkles size={iconSize} color={iconColor} />;
      }
    } catch (error) {
      // Fallback to ActivityIndicator if icons fail
      return <ActivityIndicator size="large" color={iconColor} />;
    }
  };

  const containerStyle = size === 'small' ? styles.smallContainer : 
                        size === 'medium' ? styles.mediumContainer : styles.container;

  return (
    <Animated.View 
      style={[
        containerStyle, 
        { opacity: fadeValue }
      ]}
    >
      {/* Main Loading Circle */}
      <View style={[
        styles.loadingCircle,
        size === 'small' ? styles.smallCircle : 
        size === 'medium' ? styles.mediumCircle : styles.largeCircle
      ]}>
        {getIcon()}
      </View>

      {/* Loading indicator */}
      <View style={styles.indicatorContainer}>
        <ActivityIndicator size="small" color={colors.lightPurple} />
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background || colors.white,
    paddingHorizontal: 20,
  },
  mediumContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: colors.background || colors.white,
  },
  smallContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: colors.background || colors.white,
  },
  loadingCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 50,
    shadowColor: colors.lightPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
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
  indicatorContainer: {
    marginBottom: 20,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    maxWidth: 300,
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
});

export default SafeLoadingScreen;