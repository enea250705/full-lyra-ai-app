import React, { useState, useMemo } from 'react';
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
import { useI18n } from '@/i18n';

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
  onRequestLocationPermission: () => Promise<boolean>;
  onRequestHealthKitPermission: () => Promise<boolean>;
  onRequestNotificationsPermission: () => Promise<boolean>;
  onSkip: () => void;
  onContinue: () => void;
}

export const PermissionsRequestModal: React.FC<PermissionsRequestModalProps> = ({
  visible,
  permissions,
  onRequestPermissions,
  onRequestLocationPermission,
  onRequestHealthKitPermission,
  onRequestNotificationsPermission,
  onSkip,
  onContinue,
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const { t } = useI18n();

  const permissionItems: PermissionItem[] = useMemo(() => [
    {
      id: 'location',
      title: t('permissions.location_title'),
      description: t('permissions.location_desc'),
      icon: <MapPin size={24} color={colors.midnightBlue} />,
      required: false,
      granted: permissions.location.granted,
    },
    {
      id: 'healthKit',
      title: t('permissions.health_title'),
      description: t('permissions.health_desc'),
      icon: <Heart size={24} color={colors.midnightBlue} />,
      required: false,
      granted: permissions.healthKit.granted,
    },
    {
      id: 'notifications',
      title: t('permissions.notifications_title'),
      description: t('permissions.notifications_desc'),
      icon: <Bell size={24} color={colors.midnightBlue} />,
      required: false,
      granted: permissions.notifications.granted,
    },
  ], [permissions.location.granted, permissions.healthKit.granted, permissions.notifications.granted]);

  const handleRequestPermissions = async () => {
    setIsRequesting(true);
    try {
      console.log('[PermissionsRequestModal] Requesting permissions...');
      await onRequestPermissions();
      console.log('[PermissionsRequestModal] Permissions request completed');
    } catch (error) {
      console.error('[PermissionsRequestModal] Error requesting permissions:', error);
      Alert.alert(
        t('permissions.request_failed_title'),
        t('permissions.request_failed_message'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      t('common.info'),
      t('permissions.denied_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('permissions.skip'), onPress: onSkip },
      ]
    );
  };

  const handleClose = () => {
    // Allow direct dismissal without confirmation
    onSkip();
  };

  const handleIndividualPermissionRequest = async (permissionId: string) => {
    try {
      setIsRequesting(true);
      console.log(`[PermissionsRequestModal] Requesting ${permissionId} permission...`);
      
      let granted = false;
      switch (permissionId) {
        case 'location':
          granted = await onRequestLocationPermission();
          break;
        case 'healthKit':
          granted = await onRequestHealthKitPermission();
          break;
        case 'notifications':
          granted = await onRequestNotificationsPermission();
          break;
        default:
          console.warn(`[PermissionsRequestModal] Unknown permission: ${permissionId}`);
          return;
      }
      
      console.log(`[PermissionsRequestModal] ${permissionId} permission result:`, granted);
      
      if (granted) {
        // Show success message
        Alert.alert(
          t('common.success'),
          `${permissionId === 'location' ? 'Location' : permissionId === 'healthKit' ? 'Health & Sleep Data' : 'Notifications'} permission granted!`,
          [{ text: t('common.ok') }]
        );
      }
    } catch (error) {
      console.error(`[PermissionsRequestModal] Error requesting ${permissionId} permission:`, error);
      Alert.alert(
        t('common.error'),
        `Failed to request ${permissionId === 'location' ? 'location' : permissionId === 'healthKit' ? 'health' : 'notification'} permission`,
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const grantedCount = permissionItems.filter(item => item.granted).length;
  const totalCount = permissionItems.length;

  console.log('[PermissionsRequestModal] Render:', { 
    visible, 
    permissions, 
    grantedCount, 
    totalCount,
    permissionItems: permissionItems.map(item => ({ id: item.id, granted: item.granted }))
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(255,255,255,0.98)', 'rgba(255,255,255,1)']}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <XCircle size={24} color={colors.midnightBlue} />
            </TouchableOpacity>
            <View style={styles.iconContainer}>
              <Shield size={32} color={colors.midnightBlue} />
            </View>
            <Text style={styles.title}>{t('permissions.welcome_title')}</Text>
            <Text style={styles.subtitle}>
              {t('permissions.welcome_subtitle')}
            </Text>
          </View>

          <View style={styles.permissionsContainer}>
            <Text style={styles.sectionTitle}>{t('permissions.section_title')}</Text>
            <Text style={styles.sectionDescription}>
              {t('permissions.section_description')}
            </Text>

            {permissionItems.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[
                  styles.permissionItem,
                  item.granted && styles.permissionItemGranted
                ]}
                onPress={() => !item.granted && handleIndividualPermissionRequest(item.id)}
                disabled={item.granted || isRequesting}
                activeOpacity={item.granted ? 1 : 0.7}
              >
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
              </TouchableOpacity>
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
              {t('permissions.progress_text', { granted: String(grantedCount), total: String(totalCount) })}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={isRequesting}
            >
              <Text style={styles.skipButtonText}>{t('permissions.skip')}</Text>
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
                  {isRequesting ? t('common.processing') : t('permissions.enable')}
                </Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('permissions.footer')}
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
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -20,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
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
  permissionItemGranted: {
    backgroundColor: colors.success + '15', // Light green background
    borderWidth: 1,
    borderColor: colors.success + '30',
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