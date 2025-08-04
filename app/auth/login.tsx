import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { GoogleSignInButton } from '../../components/ui/GoogleSignInButton';
import { colors } from '../../constants/colors';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      console.log('Login failed, error:', error);
      
      // If login fails with invalid credentials, suggest registration
      if (error instanceof Error && error.message.includes('Invalid credentials')) {
        Alert.alert(
          'User Not Found', 
          'This email is not registered. Please create an account first.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Go to Register', 
              onPress: () => router.push('/auth/register')
            }
          ]
        );
      } else {
        Alert.alert('Login Failed', error instanceof Error ? error.message : 'An error occurred');
      }
    }
  };

  return (
    <LinearGradient
      colors={['#0f0f23', '#1a1a3e', '#2d1b69', '#0f0f23']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Static Stars */}
      <View style={[styles.star, styles.star1]}>
        <Text style={styles.starText}>✦</Text>
      </View>
      <View style={[styles.star, styles.star2]}>
        <Text style={styles.starText}>✧</Text>
      </View>
      <View style={[styles.star, styles.star3]}>
        <Text style={styles.starText}>⭐</Text>
      </View>
      
      {/* Lyra Constellation Pattern */}
      <View style={styles.constellation}>
        <View style={[styles.constellationStar, { top: 80, left: 50 }]} />
        <View style={[styles.constellationStar, { top: 120, left: 100 }]} />
        <View style={[styles.constellationStar, { top: 90, left: 150 }]} />
        <View style={[styles.constellationStar, { top: 140, left: 200 }]} />
        <View style={[styles.constellationStar, { top: 100, left: 250 }]} />
        {/* Connection lines */}
        <View style={[styles.constellationLine, { top: 85, left: 55, width: 50, transform: [{ rotate: '30deg' }] }]} />
        <View style={[styles.constellationLine, { top: 125, left: 105, width: 50, transform: [{ rotate: '-30deg' }] }]} />
        <View style={[styles.constellationLine, { top: 95, left: 155, width: 50, transform: [{ rotate: '45deg' }] }]} />
        <View style={[styles.constellationLine, { top: 145, left: 205, width: 50, transform: [{ rotate: '-45deg' }] }]} />
      </View>
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <Text style={styles.lyraText}>LYRA</Text>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Continue your wellness journey</Text>
          </View>
          
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            
            <LinearGradient
              colors={['#6b46c1', '#8b5cf6', '#a855f7']}
              style={styles.loginButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Button
                title={isLoading ? "Signing in..." : "Sign In"}
                onPress={handleLogin}
                disabled={isLoading}
                style={styles.loginButtonInner}
                textStyle={styles.loginButtonText}
              />
            </LinearGradient>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-In Button */}
            <GoogleSignInButton
              buttonText="Sign in with Google"
              onSuccess={() => router.replace('/(tabs)')}
              disabled={isLoading}
            />
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Button
              title="Sign Up"
              onPress={() => router.push('/auth/register')}
              style={styles.linkButton}
              textStyle={styles.linkButtonText}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    position: 'relative',
    zIndex: 2,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  lyraText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(139, 92, 246, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    gap: 20,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    overflow: 'hidden',
  },
  input: {
    padding: 18,
    fontSize: 16,
    color: '#ffffff',
    backgroundColor: 'transparent',
  },
  loginButton: {
    borderRadius: 15,
    marginTop: 10,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonInner: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  linkButton: {
    backgroundColor: 'transparent',
    padding: 0,
  },
  linkButtonText: {
    color: '#a855f7',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Divider styles
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  // Floating stars
  star: {
    position: 'absolute',
    zIndex: 1,
    pointerEvents: 'none',
  },
  star1: {
    top: 100,
    left: 80,
  },
  star2: {
    top: 200,
    right: 60,
  },
  star3: {
    bottom: 150,
    left: 40,
  },
  starText: {
    color: '#ffffff',
    fontSize: 20,
    textShadowColor: 'rgba(139, 92, 246, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  // Constellation
  constellation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
    pointerEvents: 'none',
  },
  constellationStar: {
    position: 'absolute',
    width: 3,
    height: 3,
    backgroundColor: '#ffffff',
    borderRadius: 1.5,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  constellationLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});