import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lock, Crown, Star, Zap } from 'lucide-react-native';
import { useSubscription } from '../../hooks/useSubscription';

interface FeatureRestrictionProps {
  featureId: string;
  featureName: string;
  children: React.ReactNode;
  onUpgrade: () => void;
  showUpgradeButton?: boolean;
  style?: any;
}

const FeatureRestriction: React.FC<FeatureRestrictionProps> = ({
  featureId,
  featureName,
  children,
  onUpgrade,
  showUpgradeButton = true,
  style,
}) => {
  const { hasFeature, subscription } = useSubscription();

  const hasAccess = hasFeature(featureId);

  if (hasAccess) {
    return <>{children}</>;
  }

  const getRequiredPlan = () => {
    if (featureId.includes('premium') || 
        featureId.includes('location') || 
        featureId.includes('sms') || 
        featureId.includes('weather') || 
        featureId.includes('sleep') ||
        featureId.includes('custom') ||
        featureId.includes('unlimited')) {
      return 'premium';
    }
    return 'pro';
  };

  const getPlanIcon = () => {
    const requiredPlan = getRequiredPlan();
    if (requiredPlan === 'premium') {
      return <Crown size={20} color="#8B5CF6" />;
    }
    return <Star size={20} color="#3B82F6" />;
  };

  const getPlanColor = () => {
    const requiredPlan = getRequiredPlan();
    if (requiredPlan === 'premium') {
      return '#8B5CF6';
    }
    return '#3B82F6';
  };

  const getPlanDisplayName = () => {
    return getRequiredPlan().charAt(0).toUpperCase() + getRequiredPlan().slice(1);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.lockOverlay}>
        <View style={styles.lockContent}>
          <View style={styles.lockIcon}>
            <Lock size={24} color="#9CA3AF" />
          </View>
          
          <View style={styles.lockInfo}>
            <Text style={styles.lockTitle}>{featureName}</Text>
            <View style={styles.planRequired}>
              {getPlanIcon()}
              <Text style={[styles.planRequiredText, { color: getPlanColor() }]}>
                {getPlanDisplayName()} Plan Required
              </Text>
            </View>
          </View>

          {showUpgradeButton && (
            <TouchableOpacity 
              style={[styles.upgradeButton, { backgroundColor: getPlanColor() }]}
              onPress={onUpgrade}
            >
              <Zap size={16} color="#FFFFFF" />
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={styles.disabledContent}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockContent: {
    alignItems: 'center',
  },
  lockIcon: {
    backgroundColor: '#F3F4F6',
    borderRadius: 50,
    padding: 16,
    marginBottom: 16,
  },
  lockInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  lockTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  planRequired: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  planRequiredText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledContent: {
    opacity: 0.3,
  },
});

export default FeatureRestriction;