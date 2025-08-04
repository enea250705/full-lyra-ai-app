import React from 'react';
import { Pressable, Text, StyleSheet, View, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  buttonText?: string;
  disabled?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  buttonText = "Continue with Google",
  disabled = false,
}) => {
  const { loginWithGoogle, isLoading } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      onSuccess?.();
    } catch (error) {
      Alert.alert(
        'Google Sign-In Failed',
        error instanceof Error ? error.message : 'An error occurred during Google sign-in'
      );
    }
  };

  return (
    <Pressable
      style={[styles.container, disabled && styles.disabled]}
      onPress={handleGoogleSignIn}
      disabled={disabled || isLoading}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.googleIcon}>G</Text>
          </View>
          <Text style={styles.buttonText}>
            {isLoading ? 'Signing in...' : buttonText}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  disabled: {
    opacity: 0.5,
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4285f4',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
}); 