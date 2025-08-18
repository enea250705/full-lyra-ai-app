import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Smartphone, Shield, Activity, Clock } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useI18n } from '@/i18n';

const { width } = Dimensions.get('window');

interface HealthKitPermissionCardProps {
  onRequestPermission: () => void;
  isLoading: boolean;
  isEnabled?: boolean;
  onDisable?: () => void;
}

export const HealthKitPermissionCard: React.FC<HealthKitPermissionCardProps> = ({
  onRequestPermission,
  isLoading,
  isEnabled = false,
  onDisable,
}) => {
  const { t } = useI18n();
  if (isEnabled) {
    return (
      <View style={styles.enabledContainer}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.enabledHeader}
        >
          <View style={styles.enabledIconContainer}>
            <Heart size={24} color="#FFFFFF" />
          </View>
          <View style={styles.enabledTextContainer}>
            <Text style={styles.enabledTitle}>{t('healthkit_card.connected_title')}</Text>
            <Text style={styles.enabledSubtitle}>{t('healthkit_card.connected_subtitle')}</Text>
          </View>
        </LinearGradient>
        
        <View style={styles.enabledContent}>
          <View style={styles.featureRow}>
            <Activity size={16} color="#10B981" />
            <Text style={styles.featureText}>{t('healthkit_card.auto_detection')}</Text>
          </View>
          <View style={styles.featureRow}>
            <Clock size={16} color="#10B981" />
            <Text style={styles.featureText}>{t('healthkit_card.stages_tracking')}</Text>
          </View>
          <View style={styles.featureRow}>
            <Heart size={16} color="#10B981" />
            <Text style={styles.featureText}>{t('healthkit_card.heart_rate')}</Text>
          </View>
          
          {onDisable && (
            <TouchableOpacity
              style={styles.disableButton}
              onPress={onDisable}
            >
              <Text style={styles.disableButtonText}>{t('healthkit_card.disable_button')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667EEA', '#764BA2']}
        style={styles.header}
      >
        <View style={styles.iconContainer}>
          <Heart size={32} color="#FFFFFF" />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{t('healthkit_card.enable_title')}</Text>
          <Text style={styles.subtitle}>
            {t('healthkit_card.enable_subtitle')}
          </Text>
        </View>
      </LinearGradient>
      
      <View style={styles.content}>
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Activity size={16} color="#667EEA" />
            <Text style={styles.benefitText}>{t('healthkit_card.benefit_auto')}</Text>
          </View>
          <View style={styles.benefitItem}>
            <Clock size={16} color="#667EEA" />
            <Text style={styles.benefitText}>{t('healthkit_card.benefit_stages')}</Text>
          </View>
          <View style={styles.benefitItem}>
            <Heart size={16} color="#667EEA" />
            <Text style={styles.benefitText}>{t('healthkit_card.benefit_hr')}</Text>
          </View>
          <View style={styles.benefitItem}>
            <Shield size={16} color="#667EEA" />
            <Text style={styles.benefitText}>{t('healthkit_card.benefit_privacy')}</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.button}
          onPress={onRequestPermission}
          disabled={isLoading}
        >
          <LinearGradient
            colors={isLoading ? ['#9CA3AF', '#6B7280'] : ['#667EEA', '#764BA2']}
            style={styles.buttonGradient}
          >
            <Smartphone size={16} color="#FFFFFF" />
            <Text style={styles.buttonText}>
              {isLoading ? t('healthkit_card.connecting') : t('healthkit_card.connect_button')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <Text style={styles.disclaimer}>
          {t('healthkit_card.disclaimer')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  content: {
    padding: 20,
    paddingTop: 16,
  },
  benefitsList: {
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  benefitText: {
    fontSize: 14,
    color: colors.gray[700],
    marginLeft: 12,
    flex: 1,
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disclaimer: {
    fontSize: 12,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 16,
  },
  // Enabled state styles
  enabledContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  enabledHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  enabledIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  enabledTextContainer: {
    flex: 1,
  },
  enabledTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  enabledSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  enabledContent: {
    padding: 16,
    paddingTop: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  featureText: {
    fontSize: 13,
    color: colors.gray[600],
    marginLeft: 8,
  },
  disableButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    alignSelf: 'flex-start',
  },
  disableButtonText: {
    fontSize: 13,
    color: colors.gray[600],
    fontWeight: '500',
  },
});

export default HealthKitPermissionCard;