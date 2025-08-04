import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Moon, Smartphone, Edit3, Activity } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface SleepTrackingModeCardProps {
  isAutoTrackingEnabled: boolean;
  isHealthKitAvailable: boolean;
  onToggleAutoTracking: () => void;
  onManualEntry: () => void;
  isLoading?: boolean;
}

export const SleepTrackingModeCard: React.FC<SleepTrackingModeCardProps> = ({
  isAutoTrackingEnabled,
  isHealthKitAvailable,
  onToggleAutoTracking,
  onManualEntry,
  isLoading = false,
}) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        style={styles.header}
      >
        <Moon size={24} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Sleep Tracking</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Auto Tracking Section */}
        {isHealthKitAvailable && (
          <View style={styles.trackingOption}>
            <View style={styles.optionHeader}>
              <View style={styles.optionIcon}>
                <Smartphone size={18} color="#4F46E5" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Automatic Tracking</Text>
                <Text style={styles.optionDescription}>
                  Uses Apple Health to automatically detect and track your sleep
                </Text>
              </View>
              <Switch
                value={isAutoTrackingEnabled}
                onValueChange={onToggleAutoTracking}
                trackColor={{ false: colors.gray[300], true: '#4F46E5' }}
                thumbColor={isAutoTrackingEnabled ? '#FFFFFF' : '#F3F4F6'}
                disabled={isLoading}
              />
            </View>
            
            {isAutoTrackingEnabled && (
              <View style={styles.autoTrackingBenefits}>
                <View style={styles.benefitItem}>
                  <Activity size={12} color="#10B981" />
                  <Text style={styles.benefitText}>Sleep stages detection</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Activity size={12} color="#10B981" />
                  <Text style={styles.benefitText}>Heart rate monitoring</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Activity size={12} color="#10B981" />
                  <Text style={styles.benefitText}>Sleep efficiency calculation</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Manual Tracking Section */}
        <View style={[styles.trackingOption, { marginTop: isHealthKitAvailable ? 16 : 0 }]}>
          <TouchableOpacity 
            style={styles.manualTrackingButton}
            onPress={onManualEntry}
            disabled={isLoading}
          >
            <View style={styles.optionHeader}>
              <View style={styles.optionIcon}>
                <Edit3 size={18} color="#6B7280" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Manual Entry</Text>
                <Text style={styles.optionDescription}>
                  Manually log your sleep times and quality
                </Text>
              </View>
              <View style={styles.manualEntryArrow}>
                <Text style={styles.arrowText}>→</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Status Message */}
        <View style={styles.statusContainer}>
          {isAutoTrackingEnabled ? (
            <View style={styles.statusActive}>
              <Activity size={14} color="#10B981" />
              <Text style={styles.statusText}>
                Automatic tracking is active. Sleep will be detected automatically.
              </Text>
            </View>
          ) : (
            <View style={styles.statusInactive}>
              <Moon size={14} color="#6B7280" />
              <Text style={styles.statusText}>
                {isHealthKitAvailable 
                  ? 'Use manual entry or enable automatic tracking above.'
                  : 'Manual entry is your primary tracking method.'
                }
              </Text>
            </View>
          )}
        </View>
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
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  trackingOption: {
    borderRadius: 12,
    backgroundColor: colors.gray[50],
    padding: 16,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 18,
  },
  manualTrackingButton: {
    borderRadius: 8,
  },
  manualEntryArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  arrowText: {
    fontSize: 16,
    color: colors.gray[600],
    fontWeight: '600',
  },
  autoTrackingBenefits: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 12,
    color: colors.gray[600],
    marginLeft: 8,
  },
  statusContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  statusActive: {
    backgroundColor: '#F0FDF4',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  statusInactive: {
    backgroundColor: colors.gray[50],
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  statusText: {
    fontSize: 13,
    color: colors.gray[700],
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});

export default SleepTrackingModeCard;