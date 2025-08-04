import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Alert, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Lock, Crown, Star, Zap, Sparkles, ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNativeSubscription } from '../../hooks/useNativeSubscription';
import SubscriptionPlanCard from './SubscriptionPlanCard';

interface SubscriptionUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  featureId?: string;
  featureName?: string;
}

const { width, height } = Dimensions.get('window');

const SubscriptionUpgradeModal: React.FC<SubscriptionUpgradeModalProps> = ({
  visible,
  onClose,
  featureId,
  featureName,
}) => {
  const { 
    subscriptionStatus,
    isLoading: subscriptionLoading,
    availableProducts,
    purchaseSubscription,
    restorePurchases,
    refreshStatus,
    isProActive,
    isPremiumActive,
    isFree,
    currentPlan
  } = useNativeSubscription();
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0);

  // Mock plan data - you can move this to a constants file
  const planData = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: 'month',
      popular: false,
      features: [
        { id: 'basic_chat', name: 'Basic AI Chat', description: '10 conversations per day' },
        { id: 'mood_tracking', name: 'Basic Mood Tracking', description: 'Track your daily mood and energy' },
        { id: 'basic_goals', name: 'Basic Goal Setting', description: 'Set and track up to 3 goals' },
        { id: 'spending_tracking', name: 'Basic Spending Tracking', description: 'See your transactions and categories' },
        { id: 'weekly_reports', name: 'Weekly Email Reports', description: 'Automated weekly summaries' },
        { id: 'basic_calendar', name: 'Calendar Read-Only', description: 'View your appointments' },
        { id: 'basic_alerts', name: 'Basic Spending Alerts', description: 'Simple daily spending notifications' },
        { id: '30_day_history', name: '30 Days History', description: 'Last 30 days of data retention' }
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 9.99,
      interval: 'month',
      popular: true,
      features: [
        // All Free features, plus Pro features:
        { id: 'unlimited_chat', name: 'Unlimited AI Chat', description: 'No daily conversation limits' },
        { id: 'basic_analytics', name: 'Basic Analytics', description: 'Simple mood and energy tracking analytics' },
        { id: 'goal_coaching', name: 'AI Goal Coaching', description: 'Personalized coaching and accountability' },
        { id: 'calendar_sync', name: 'Calendar Integration', description: 'Smart scheduling and rescheduling' },
        { id: 'basic_interventions', name: 'Basic Spending Alerts', description: 'Simple spending notifications' },
        { id: 'savings_counter', name: 'Savings Tracking', description: 'Track how much you saved' },
        { id: 'push_notifications', name: 'Smart Notifications', description: 'Real-time basic alerts' },
        { id: 'extended_history', name: '6 Months History', description: 'Extended data retention' },
        { id: 'journal_insights', name: 'Journal AI Insights', description: 'AI analysis of your journal entries' }
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 19.99,
      interval: 'month',
      popular: false,
      features: [
        // Premium-only features (Free and Pro features are inherited):
        { id: 'crisis_support', name: '24/7 Crisis Support', description: 'Immediate AI crisis intervention' },
        { id: 'location_alerts', name: 'Location-based Alerts', description: 'Smart spending alerts based on your location' },
        { id: 'sleep_analysis', name: 'Advanced Sleep Analysis', description: 'Deep sleep pattern insights with correlations' },
        { id: 'weather_mood', name: 'Weather-Mood Correlation', description: 'Advanced weather impact analysis' },
        { id: 'sms_alerts', name: 'SMS Emergency Alerts', description: 'Urgent spending warnings via SMS' },
        { id: 'unlimited_history', name: 'Unlimited Data History', description: 'Never lose your data - unlimited retention' },
        { id: 'priority_support', name: 'Priority Support', description: 'VIP customer support with faster response' },
        { id: 'financial_alerts', name: 'Financial Alerts on Overspending', description: 'Advanced overspending protection and alerts' }
      ]
    }
  ];

  const handlePlanSelect = async (planId: string) => {
    if (planId === currentPlan) {
      return;
    }

    setSelectedPlan(planId);
    setIsLoading(true);

    try {
      if (planId === 'free') {
        Alert.alert(
          'Confirm Downgrade',
          'Are you sure you want to downgrade to the free plan? You will lose access to premium features.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Downgrade',
              style: 'destructive',
              onPress: async () => {
                // For free plan, we can't purchase - user would need to cancel their subscription
                Alert.alert('Info', 'To downgrade, please cancel your current subscription and it will revert to free at the end of the billing period.');
                setSelectedPlan(null);
                setIsLoading(false);
              },
            },
          ]
        );
      } else {
        // Handle native IAP purchase
        const productId = planId === 'pro' ? 'lyra_pro_monthly' : 'lyra_premium_monthly';
        
        Alert.alert(
          'Purchase Subscription',
          `Upgrade to ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan?`,
          [
            { 
              text: 'Cancel', 
              style: 'cancel',
              onPress: () => {
                setSelectedPlan(null);
                setIsLoading(false);
              }
            },
            {
              text: 'Purchase',
              onPress: async () => {
                try {
                  const result = await purchaseSubscription(productId);
                  if (result.success) {
                    onClose();
                  }
                } catch (error) {
                  console.error('Purchase error:', error);
                } finally {
                  setSelectedPlan(null);
                  setIsLoading(false);
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update subscription. Please try again.');
      setSelectedPlan(null);
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIsLoading(true);
    try {
      await restorePurchases();
    } catch (error) {
      console.error('Error restoring purchases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter available plans based on current status  
  const availablePlans = planData.filter(plan => plan.id !== currentPlan);

  const getFeatureIcon = (featureId?: string) => {
    if (!featureId) return <Lock size={24} color="#EF4444" />;
    
    if (featureId.includes('premium') || featureId.includes('location') || featureId.includes('sms')) {
      return <Crown size={24} color="#8B5CF6" />;
    } else if (featureId.includes('pro') || featureId.includes('ai') || featureId.includes('advanced')) {
      return <Star size={24} color="#3B82F6" />;
    }
    return <Zap size={24} color="#10B981" />;
  };

  const getRequiredPlan = (featureId?: string) => {
    if (!featureId) return 'pro';
    
    if (featureId.includes('premium') || featureId.includes('location') || featureId.includes('sms') || featureId.includes('weather') || featureId.includes('sleep')) {
      return 'premium';
    }
    return 'pro';
  };

  const upgradeOptions = planData; // Show all plans for selection
  const selectedPlanData = upgradeOptions[currentPlanIndex];

  const goToPreviousPlan = () => {
    if (currentPlanIndex > 0) {
      setCurrentPlanIndex(currentPlanIndex - 1);
    }
  };

  const goToNextPlan = () => {
    if (currentPlanIndex < upgradeOptions.length - 1) {
      setCurrentPlanIndex(currentPlanIndex + 1);
    }
  };

  const onGestureEvent = (event: any) => {
    const { translationX, state } = event.nativeEvent;
    
    if (state === State.END) {
      if (translationX > 50) {
        // Swipe right - go to previous plan
        goToPreviousPlan();
      } else if (translationX < -50) {
        // Swipe left - go to next plan
        goToNextPlan();
      }
    }
  };

  const getPlanColors = (planId: string): readonly [string, string, ...string[]] => {
    switch (planId) {
      case 'premium':
        return ['#8B5CF6', '#7C3AED'];
      case 'pro':
        return ['#3B82F6', '#2563EB'];
      default:
        return ['#6B7280', '#4B5563'];
    }
  };

  const getPlanIcon = (planId: string) => {
    const iconProps = { size: 56, strokeWidth: 1.5 };
    
    switch (planId) {
      case 'premium':
        return (
          <View style={styles.planIconContainer}>
            <Crown {...iconProps} color="#8B5CF6" fill="#8B5CF6" />
          </View>
        );
      case 'pro':
        return (
          <View style={styles.planIconContainer}>
            <Star {...iconProps} color="#3B82F6" fill="#3B82F6" />
          </View>
        );
      default:
        return (
          <View style={styles.planIconContainer}>
            <Zap {...iconProps} color="#6B7280" />
          </View>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PanGestureHandler onGestureEvent={onGestureEvent}>
          <LinearGradient
            colors={getPlanColors(selectedPlanData?.id || 'free')}
            style={styles.container}
          >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Choose Your Plan</Text>
            <Text style={styles.headerSubtitle}>
              {featureName ? `Unlock ${featureName} and premium features` : 'Unlock premium features to enhance your life operating system'}
            </Text>
            <View style={styles.trustBadges}>
              <View style={styles.trustBadge}>
                <Star size={14} color="#FFD700" fill="#FFD700" />
                <Text style={styles.trustText}>Premium Quality</Text>
              </View>
              <View style={styles.trustBadge}>
                <Lock size={14} color="#10B981" />
                <Text style={styles.trustText}>Secure & Private</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Plan Navigation */}
        <View style={styles.planNavigation}>
          <View style={styles.planIndicator}>
            {upgradeOptions.map((plan, index) => (
              <TouchableOpacity 
                key={index}
                style={[styles.planTab, index === currentPlanIndex && styles.activePlanTab]}
                onPress={() => setCurrentPlanIndex(index)}
              >
                <Text style={[styles.planTabText, index === currentPlanIndex && styles.activePlanTabText]}>
                  {plan.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Single Plan Display */}
        <ScrollView style={styles.planContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              {getPlanIcon(selectedPlanData?.id || 'free')}
              <Text style={styles.planName}>{selectedPlanData?.name || 'Free'}</Text>
              <Text style={styles.planPrice}>
                {selectedPlanData?.price === 0 ? 'Free' : `€${selectedPlanData?.price?.toFixed(2)}/${selectedPlanData?.interval}`}
              </Text>
            </View>

            <View style={styles.featuresContainer}>
              {/* Show "Everything in Free and Pro, plus:" for Premium plans */}
              {selectedPlanData?.id === 'premium' && (
                <View style={styles.inheritedFeaturesSection}>
                  <View style={styles.inheritedHeader}>
                    <Crown size={18} color="#8B5CF6" />
                    <Text style={styles.inheritedTitle}>Everything in Free and Pro, plus:</Text>
                  </View>
                </View>
              )}
              
              {/* Show "Everything in Free, plus:" for Pro plans */}
              {selectedPlanData?.id === 'pro' && (
                <View style={styles.inheritedFeaturesSection}>
                  <View style={styles.inheritedHeader}>
                    <Star size={18} color="#3B82F6" />
                    <Text style={styles.inheritedTitle}>Everything in Free, plus:</Text>
                  </View>
                </View>
              )}
              
              {/* Current plan features */}
              <View style={styles.planFeaturesSection}>
                {selectedPlanData?.features?.map((feature, index) => (
                  <View key={feature.id} style={styles.featureItem}>
                    <View style={styles.featureCheck}>
                      <Check size={14} color="#10B981" strokeWidth={2} />
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureText}>{feature.name}</Text>
                      {feature.description && (
                        <Text style={styles.featureDescription}>{feature.description}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* Popular badge for popular plans */}
              {selectedPlanData?.popular && (
                <View style={styles.popularBadge}>
                  <Sparkles size={16} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          {selectedPlanData?.id !== 'free' && (
            <View style={styles.pricingInfo}>
              <Text style={styles.pricingText}>
                Start your {selectedPlanData?.interval}ly subscription for €{selectedPlanData?.price?.toFixed(2)}
              </Text>
              <Text style={styles.billingText}>
                No hidden fees
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[
              styles.actionButton,
              currentPlan === selectedPlanData?.id && styles.actionButtonCurrent,
              selectedPlanData?.id === 'premium' && styles.actionButtonPremium
            ]}
            onPress={() => handlePlanSelect(selectedPlanData?.id || 'free')}
            disabled={isLoading || subscriptionLoading || currentPlan === selectedPlanData?.id}
          >
            <Text style={[
              styles.actionButtonText,
              currentPlan === selectedPlanData?.id && styles.actionButtonTextCurrent
            ]}>
              {isLoading || subscriptionLoading ? 'Processing...' : 
               currentPlan === selectedPlanData?.id ? '✓ Current Plan' :
               selectedPlanData?.id === 'free' ? 'Downgrade to Free' : `Start ${selectedPlanData?.name} Plan`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={isLoading || subscriptionLoading}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>
          
          <Text style={styles.guaranteeText}>
            💰 7-day free trial • Cancel anytime
          </Text>
        </View>
          </LinearGradient>
        </PanGestureHandler>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  closeButton: {
    position: 'absolute',
    left: 20,
    top: 50,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  headerContent: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  trustBadges: {
    flexDirection: 'row',
    gap: 16,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  planNavigation: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  planIndicator: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
  },
  planTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activePlanTab: {
    backgroundColor: '#FFFFFF',
  },
  planTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activePlanTabText: {
    color: '#1F2937',
  },
  planContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  planIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  planName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  planPrice: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
  },
  featuresContainer: {
    gap: 20,
  },
  inheritedFeaturesSection: {
    marginBottom: 16,
  },
  inheritedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  inheritedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B21A8',
  },
  planFeaturesSection: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  featureCheck: {
    width: 20,
    height: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
    marginLeft: 12,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 2,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    gap: 6,
    marginTop: 8,
  },
  popularText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  pricingInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  pricingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  billingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonCurrent: {
    backgroundColor: '#E5E7EB',
  },
  actionButtonPremium: {
    backgroundColor: '#8B5CF6',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  actionButtonTextCurrent: {
    color: '#6B7280',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  restoreButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  restoreButtonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  guaranteeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default SubscriptionUpgradeModal;