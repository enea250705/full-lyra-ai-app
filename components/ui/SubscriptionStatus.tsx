import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Crown, Star, Calendar, AlertCircle } from 'lucide-react-native';
import { useSubscription } from '../../hooks/useSubscription';

interface SubscriptionStatusProps {
  onUpgrade: () => void;
  style?: any;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ onUpgrade, style }) => {
  const { subscription, plans } = useSubscription();

  if (!subscription) return null;

  const getPlanIcon = () => {
    switch (subscription.plan) {
      case 'premium':
        return <Crown size={20} color="#8B5CF6" />;
      case 'pro':
        return <Star size={20} color="#3B82F6" />;
      default:
        return null;
    }
  };

  const getPlanColor = () => {
    switch (subscription.plan) {
      case 'premium':
        return '#8B5CF6';
      case 'pro':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const getPlanDisplayName = () => {
    return subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusMessage = () => {
    if (subscription.plan === 'free') {
      return 'Upgrade to unlock premium features';
    }
    
    if (subscription.cancelAtPeriodEnd) {
      return `Cancels on ${formatDate(subscription.currentPeriodEnd!)}`;
    }
    
    if (subscription.currentPeriodEnd) {
      return `Renews on ${formatDate(subscription.currentPeriodEnd)}`;
    }
    
    return 'Active subscription';
  };

  const getStatusColor = () => {
    if (subscription.plan === 'free') return '#6B7280';
    if (subscription.cancelAtPeriodEnd) return '#EF4444';
    return '#10B981';
  };

  const shouldShowUpgrade = () => {
    return subscription.plan !== 'premium';
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.planInfo}>
          <View style={styles.planNameContainer}>
            {getPlanIcon()}
            <Text style={[styles.planName, { color: getPlanColor() }]}>
              {getPlanDisplayName()} Plan
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusMessage()}
            </Text>
          </View>
        </View>
        
        {shouldShowUpgrade() && (
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <Text style={styles.upgradeButtonText}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>

      {subscription.plan === 'free' && (
        <View style={styles.limitInfo}>
          <View style={styles.limitItem}>
            <AlertCircle size={16} color="#F59E0B" />
            <Text style={styles.limitText}>
              Data limited to {subscription.dataRetentionDays} days
            </Text>
          </View>
          <View style={styles.limitItem}>
            <Calendar size={16} color="#F59E0B" />
            <Text style={styles.limitText}>
              Basic features only
            </Text>
          </View>
        </View>
      )}

      {subscription.cancelAtPeriodEnd && (
        <View style={styles.cancelNotice}>
          <AlertCircle size={16} color="#EF4444" />
          <Text style={styles.cancelNoticeText}>
            Your subscription will not renew. You'll be downgraded to the free plan.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planInfo: {
    flex: 1,
  },
  planNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  upgradeButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  limitInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  limitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  limitText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  cancelNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  cancelNoticeText: {
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 8,
    flex: 1,
  },
});

export default SubscriptionStatus;