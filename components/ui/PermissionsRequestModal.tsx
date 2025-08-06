import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { 
  MapPin, 
  Heart, 
  Bell, 
  Shield, 
  CheckCircle, 
  XCircle,
  ArrowRight 
} from 'lucide-react-native';

interface PermissionItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
  granted: boolean;
}

interface PermissionsRequestModalProps {
  visible: boolean;
  permissions: {
    location: { granted: boolean; requested: boolean };
    healthKit: { granted: boolean; requested: boolean; available: boolean };
    notifications: { granted: boolean; requested: boolean };
  };
  onRequestPermissions: () => Promise<void>;
  onSkip: () => void;
  onContinue: () => void;
}

export const PermissionsRequestModal: React.FC<PermissionsRequestModalProps> = ({
  visible,
  permissions,
  onRequestPermissions,
  onSkip,
  onContinue,
}) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const permissionItems: PermissionItem[] = [
    {
      id: 'location',
      title: 'Location Access',
      description: 'Get weather insights and location-based recommendations',
      icon: <MapPin size={24} color={colors.midnightBlue} />,
      required: false,
      granted: permissions.location.granted,
    },
    {
      id: 'healthKit',
      title: 'Health & Sleep Tracking',
      description: 'Automatic sleep detection and health insights',
      icon: <Heart size={24} color={colors.midnightBlue} />,
      required: false,
      granted: permissions.healthKit.granted,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Get reminders and important updates',
      icon: <Bell size={24} color={colors.midnightBlue} />,
      required: false,
      granted: permissions.notifications.granted,
    },
  ];

  const handleRequestPermissions = async () => {
    setIsRequesting(true);
    try {
      await onRequestPermissions();
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert(
        'Permission Request Failed',
        'Some permissions could not be requested. You can enable them later in Settings.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Permissions?',
      'You can still use Lyra, but some features will be limited. You can enable permissions later in Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip for Now', onPress: onSkip },
      ]
    );
  };

  const grantedCount = permissionItems.filter(item => item.granted).length;
  const totalCount = permissionItems.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(255,255,255,0.98)', 'rgba(255,255,255,1)']}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Shield size={32} color={colors.midnightBlue} />
            </View>
            <Text style={styles.title}>Welcome to Lyra</Text>
            <Text style={styles.subtitle}>
              Let's set up your personalized experience
            </Text>
          </View>

          <View style={styles.permissionsContainer}>
            <Text style={styles.sectionTitle}>Permissions</Text>
            <Text style={styles.sectionDescription}>
              These permissions help Lyra provide better insights and recommendations
            </Text>

            {permissionItems.map((item) => (
              <View key={item.id} style={styles.permissionItem}>
                <View style={styles.permissionIcon}>
                  {item.icon}
                </View>
                <View style={styles.permissionContent}>
                  <Text style={styles.permissionTitle}>{item.title}</Text>
                  <Text style={styles.permissionDescription}>
                    {item.description}
                  </Text>
                </View>
                <View style={styles.permissionStatus}>
                  {item.granted ? (
                    <CheckCircle size={20} color={colors.success} />
                  ) : (
                    <XCircle size={20} color={colors.gray[300]} />
                  )}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(grantedCount / totalCount) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {grantedCount} of {totalCount} permissions granted
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={isRequesting}
            >
              <Text style={styles.skipButtonText}>Skip for Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.continueButton,
                isRequesting && styles.continueButtonDisabled
              ]}
              onPress={handleRequestPermissions}
              disabled={isRequesting}
            >
              <LinearGradient
                colors={[colors.midnightBlue, colors.deepPurple]}
                style={styles.continueButtonGradient}
              >
                <Text style={styles.continueButtonText}>
                  {isRequesting ? 'Requesting...' : 'Enable Permissions'}
                </Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              You can change these settings anytime in the app
            </Text>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.midnightBlue,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionsContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.midnightBlue,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    marginBottom: 12,
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.midnightBlue,
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
  },
  permissionStatus: {
    marginLeft: 12,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[600],
    textAlign: 'center',
  },
  continueButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.gray[500],
    textAlign: 'center',
  },
}); 