import { View, Text, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import SafeLoadingScreen from '../../components/ui/SafeLoadingScreen';

export default function AuthIndex() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#0c0c1e', '#1a1a3a', '#2a1d5f', '#0c0c1e']}
        style={styles.container}
      >
        <View style={styles.lyraContainer}>
          <Text style={styles.lyraText}>LYRA</Text>
        </View>
        <SafeLoadingScreen 
          type="auth"
          message="Welcome back..."
          subMessage="Preparing your personalized wellness experience"
        />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#0c0c1e', '#1a1a3a', '#2a1d5f', '#0c0c1e']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Floating Stars */}
      <View style={[styles.star, styles.star1]}>
        <Text style={styles.starText}>✦</Text>
      </View>
      <View style={[styles.star, styles.star2]}>
        <Text style={styles.starText}>✧</Text>
      </View>
      <View style={[styles.star, styles.star3]}>
        <Text style={styles.starText}>⭐</Text>
      </View>
      <View style={[styles.star, styles.star4]}>
        <Text style={styles.starText}>✨</Text>
      </View>
      
      {/* Central Lyra Symbol */}
      <View style={styles.lyraSymbol}>
        <View style={styles.symbolCore} />
        <View style={[styles.symbolRing, styles.ring1]} />
        <View style={[styles.symbolRing, styles.ring2]} />
      </View>
      
      {/* Background Stars */}
      <View style={styles.starField}>
        {Array.from({ length: 15 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.backgroundStar,
              {
                top: Math.random() * 600 + 50,
                left: Math.random() * 350 + 20,
                opacity: Math.random() * 0.6 + 0.3,
              },
            ]}
          />
        ))}
      </View>
      
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.lyraText}>LYRA</Text>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>Your AI wellness companion</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <LinearGradient
            colors={['#7c3aed', '#a855f7', '#c084fc']}
            style={styles.primaryButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Button
              title="Get Started"
              onPress={() => router.push('/auth/register')}
              style={styles.primaryButtonInner}
              textStyle={styles.primaryButtonText}
            />
          </LinearGradient>
          
          <View style={styles.secondaryButton}>
            <Button
              title="I already have an account"
              onPress={() => router.push('/auth/login')}
              style={styles.secondaryButtonInner}
              textStyle={styles.secondaryButtonText}
            />
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    zIndex: 3,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  lyraText: {
    fontSize: 42,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 12,
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(168, 85, 247, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
  },
  primaryButton: {
    borderRadius: 15,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  primaryButtonInner: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  secondaryButtonInner: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
  },
  secondaryButtonText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
  },
  lyraContainer: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    zIndex: 10,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 10,
  },
  // Floating stars
  star: {
    position: 'absolute',
    zIndex: 1,
    pointerEvents: 'none',
  },
  star1: {
    top: 80,
    left: 60,
  },
  star2: {
    top: 150,
    right: 80,
  },
  star3: {
    bottom: 200,
    left: 50,
  },
  star4: {
    bottom: 120,
    right: 60,
  },
  starText: {
    color: '#ffffff',
    fontSize: 22,
    textShadowColor: 'rgba(168, 85, 247, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  // Central Lyra Symbol
  lyraSymbol: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    width: 120,
    height: 120,
    zIndex: 1,
    pointerEvents: 'none',
  },
  symbolCore: {
    position: 'absolute',
    top: 50,
    left: 50,
    width: 20,
    height: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  symbolRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 50,
  },
  ring1: {
    top: 30,
    left: 30,
    width: 60,
    height: 60,
  },
  ring2: {
    top: 10,
    left: 10,
    width: 100,
    height: 100,
  },
  // Background Stars
  starField: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    pointerEvents: 'none',
  },
  backgroundStar: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#ffffff',
    borderRadius: 1,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 2,
  },
});