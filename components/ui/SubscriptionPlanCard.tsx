import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Crown, Star, Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface Feature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  features: Feature[];
  popular?: boolean;
}

interface SubscriptionPlanCardProps {
  plan: Plan;
  isCurrentPlan?: boolean;
  onSelectPlan: (planId: string) => void;
  isLoading?: boolean;
  style?: any;
}

const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  plan,
  isCurrentPlan = false,
  onSelectPlan,
  isLoading = false,
  style,
}) => {
  const getPlanColor = () => {
    switch (plan.id) {
      case 'free':
        return '#6B7280';
      case 'pro':
        return '#3B82F6';
      case 'premium':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getPlanIcon = () => {
    switch (plan.id) {
      case 'premium':
        return <Crown size={24} color="#8B5CF6" />;
      case 'pro':
        return <Star size={24} color="#3B82F6" />;
      default:
        return null;
    }
  };

  const formatPrice = () => {
    if (plan.price === 0) return 'Free';
    return `€${plan.price.toFixed(2)}/${plan.interval}`;
  };

  const getButtonText = () => {
    if (isCurrentPlan) return 'Current Plan';
    if (plan.id === 'free') return 'Downgrade to Free';
    return `Upgrade to ${plan.name}`;
  };

  const getButtonStyle = () => {
    if (isCurrentPlan) return styles.currentPlanButton;
    if (plan.id === 'free') return styles.downgradeButton;
    return [styles.upgradeButton, { backgroundColor: getPlanColor() }];
  };

  return (
    <View style={[styles.container, style, plan.popular && styles.popularContainer]}>
      {plan.popular && (
        <LinearGradient
          colors={['#667EEA', '#764BA2']}
          style={styles.popularBadge}
        >
          <Sparkles size={12} color="#FFFFFF" />
          <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
        </LinearGradient>
      )}

      <LinearGradient
        colors={plan.id === 'premium' ? ['#8B5CF6', '#7C3AED'] : plan.id === 'pro' ? ['#3B82F6', '#2563EB'] : ['#F8FAFC', '#F1F5F9']}
        style={styles.header}
      >
        <View style={styles.planInfo}>
          <View style={styles.planNameContainer}>
            {getPlanIcon()}
            <Text style={[styles.planName, { color: plan.id === 'free' ? '#1F2937' : '#FFFFFF' }]}>
              {plan.name}
            </Text>
          </View>
          <Text style={[styles.planDescription, { color: plan.id === 'free' ? '#6B7280' : 'rgba(255, 255, 255, 0.8)' }]}>{plan.description}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: plan.id === 'free' ? getPlanColor() : '#FFFFFF' }]}>
            {formatPrice()}
          </Text>
          {plan.price > 0 && (
            <Text style={[styles.priceInterval, { color: plan.id === 'free' ? '#6B7280' : 'rgba(255, 255, 255, 0.8)' }]}>per {plan.interval}</Text>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={styles.featuresContainer} showsVerticalScrollIndicator={false}>
        {plan.features.map((feature) => (
          <View key={feature.id} style={styles.featureItem}>
            <Check size={16} color="#10B981" />
            <View style={styles.featureContent}>
              <Text style={styles.featureName}>{feature.name}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={getButtonStyle()}
        onPress={() => onSelectPlan(plan.id)}
        disabled={isCurrentPlan || isLoading}
      >
        {!isCurrentPlan && plan.id !== 'free' ? (
          <LinearGradient
            colors={['#667EEA', '#764BA2']}
            style={styles.upgradeButtonGradient}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Processing...' : getButtonText()}
            </Text>
          </LinearGradient>
        ) : (
          <Text style={[
            styles.buttonText,
            isCurrentPlan && styles.currentPlanButtonText,
            plan.id === 'free' && styles.downgradeButtonText,
          ]}>
            {isLoading ? 'Processing...' : getButtonText()}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginVertical: 12,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  popularContainer: {
    borderWidth: 3,
    borderColor: '#667EEA',
    transform: [{ scale: 1.03 }],
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    zIndex: 1,
    gap: 6,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  header: {
    padding: 24,
    paddingBottom: 20,
  },
  planInfo: {
    marginBottom: 20,
  },
  planNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 28,
    fontWeight: '800',
    marginLeft: 12,
  },
  planDescription: {
    fontSize: 16,
    lineHeight: 22,
  },
  priceContainer: {
    alignItems: 'center',
  },
  price: {
    fontSize: 40,
    fontWeight: '800',
  },
  priceInterval: {
    fontSize: 16,
    marginTop: 4,
  },
  featuresContainer: {
    maxHeight: 300,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
  },
  featureContent: {
    flex: 1,
    marginLeft: 12,
  },
  featureName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  upgradeButton: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  currentPlanButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginHorizontal: 24,
    marginBottom: 24,
  },
  downgradeButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EF4444',
    marginHorizontal: 24,
    marginBottom: 24,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  currentPlanButtonText: {
    color: '#6B7280',
  },
  downgradeButtonText: {
    color: '#EF4444',
  },
});

export default SubscriptionPlanCard;