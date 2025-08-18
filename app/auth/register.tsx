import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { GoogleSignInButton } from '../../components/ui/GoogleSignInButton';
import { colors } from '../../constants/colors';
import { useI18n } from '../../i18n';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const { register, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useI18n();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert(t('common.error'), t('auth.register.error_fill_required'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.register.error_password_mismatch'));
      return;
    }

    if (password.length < 8) {
      Alert.alert(t('common.error'), t('auth.register.error_password_length'));
      return;
    }

    try {
      await register(email, password, firstName, lastName);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(t('auth.register.registration_failed'), error instanceof Error ? error.message : t('common.something_went_wrong'));
    }
  };

  return (
    <LinearGradient
      colors={['#0a0a1f', '#1e1e42', '#3d2a78', '#0a0a1f']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Cosmic Background Elements */}
      <View style={styles.nebula1} />
      <View style={styles.nebula2} />
      
      {/* Static Planet */}
      <View style={styles.planet1}>
        <View style={styles.planetInner} />
      </View>
      
      {/* Distant Stars */}
      <View style={styles.starField}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.distantStar,
              {
                top: Math.random() * 400 + 100,
                left: Math.random() * 300 + 50,
                opacity: Math.random() * 0.8 + 0.2,
              },
            ]}
          />
        ))}
      </View>
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.titleContainer}>
              <Text style={styles.lyraText}>LYRA</Text>
              <Text style={styles.title}>{t('auth.register.title')}</Text>
              <Text style={styles.subtitle}>{t('auth.register.subtitle')}</Text>
            </View>
            
            <View style={styles.form}>
              <View style={styles.nameRow}>
                <View style={[styles.inputContainer, styles.nameInput]}>
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.register.first_name')}
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                  />
                </View>
                <View style={[styles.inputContainer, styles.nameInput]}>
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.register.last_name')}
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.register.email_required')}
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
                  placeholder={t('auth.register.password_required')}
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.register.confirm_password_required')}
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              
              <LinearGradient
                colors={['#7c3aed', '#a855f7', '#c084fc']}
                style={styles.registerButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Button
                  title={isLoading ? t('auth.register.creating_account') : t('auth.register.create_account')}
                  onPress={handleRegister}
                  disabled={isLoading}
                  style={styles.registerButtonInner}
                  textStyle={styles.registerButtonText}
                />
              </LinearGradient>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('auth.register.divider_or')}</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign-In Button */}
              <GoogleSignInButton
                buttonText={t('auth.google.sign_up_with_google')}
                onSuccess={() => router.replace('/(tabs)')}
                disabled={isLoading}
              />
            </View>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.register.already_have_account')} </Text>
              <Button
                title={t('auth.register.sign_in')}
                onPress={() => router.push('/auth/login')}
                style={styles.linkButton}
                textStyle={styles.linkButtonText}
              />
            </View>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    position: 'relative',
    zIndex: 3,
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
    textShadowColor: 'rgba(168, 85, 247, 0.8)',
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
  nameRow: {
    flexDirection: 'row',
    gap: 15,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    overflow: 'hidden',
  },
  input: {
    padding: 18,
    fontSize: 16,
    color: '#ffffff',
    backgroundColor: 'transparent',
  },
  nameInput: {
    flex: 1,
  },
  registerButton: {
    borderRadius: 15,
    marginTop: 10,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  registerButtonInner: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
  },
  registerButtonText: {
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
    color: '#c084fc',
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
  // Cosmic background elements
  nebula1: {
    position: 'absolute',
    top: 50,
    left: -50,
    width: 200,
    height: 200,
    backgroundColor: '#7c3aed',
    borderRadius: 100,
    opacity: 0.3,
    transform: [{ scale: 2 }],
    zIndex: 1,
    pointerEvents: 'none',
  },
  nebula2: {
    position: 'absolute',
    bottom: 100,
    right: -80,
    width: 150,
    height: 150,
    backgroundColor: '#a855f7',
    borderRadius: 75,
    opacity: 0.2,
    zIndex: 1,
    pointerEvents: 'none',
  },
  planet1: {
    position: 'absolute',
    top: 150,
    right: 30,
    width: 60,
    height: 60,
    zIndex: 2,
    pointerEvents: 'none',
  },
  planetInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fbbf24',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  starField: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    pointerEvents: 'none',
  },
  distantStar: {
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