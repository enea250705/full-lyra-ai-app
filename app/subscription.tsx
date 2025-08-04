import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import SubscriptionUpgradeModal from '@/components/ui/SubscriptionUpgradeModal';
import { useSubscription } from '@/hooks/useSubscription';
import { colors } from '@/constants/colors';
import { Stack } from 'expo-router';
import { 
  ArrowLeft, 
  CreditCard, 
  Download, 
  Shield, 
  HelpCircle, 
  Star, 
  Zap, 
  Check,
  Crown,
  Sparkles,
  Calendar,
  TrendingUp
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function SubscriptionScreen() {
  const router = useRouter();
  const { 
    subscription, 
    plans, 
    cancelSubscription, 
    getCustomerPortal,
    isLoading 
  } = useSubscription();
  
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleUpgrade = () => {
    setUpgradeModalVisible(true);
  };

  const handleManageBilling = async () => {
    try {
      const portalUrl = await getCustomerPortal();
      if (portalUrl) {
        Alert.alert('Billing Portal', 'This would open the Stripe customer portal.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open billing portal. Please try again.');
    }
  };

  const handleCancelSubscription = () => {
    if (subscription?.plan === 'free') {
      Alert.alert('Info', 'You are already on the free plan.');
      return;
    }

    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelSubscription(false);
              Alert.alert('Success', 'Your subscription has been scheduled for cancellation.');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDownloadInvoices = () => {
    Alert.alert('Download Invoices', 'This would download your billing history.');
  };

  const getCurrentPlanFeatures = () => {
    const currentPlan = plans.find(plan => plan.id === subscription?.plan);
    return currentPlan?.features || [];
  };

  const getDataRetentionText = () => {
    if (!subscription) return '30 days';
    if (subscription.dataRetentionDays === -1) return 'Unlimited';
    return `${subscription.dataRetentionDays} days`;
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'premium':
        return <Crown size={20} color="#FFD700" />;
      case 'pro':
        return <Sparkles size={20} color="#8B5CF6" />;
      default:
        return <Star size={20} color="#64748B" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'premium':
        return ['#FFD700', '#FFA500'];
      case 'pro':
        return ['#8B5CF6', '#6366F1'];
      default:
        return ['#64748B', '#475569'];
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ScreenContainer>
        {/* Simple Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.midnightBlue} />
          </TouchableOpacity>
          <Text style={styles.title}>Subscription</Text>
        </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Plan Hero Section */}
        <LinearGradient
          colors={getPlanColor(subscription?.plan || 'free')}
          style={styles.planHero}
        >
          <View style={styles.planHeroContent}>
            <View style={styles.planHeroHeader}>
              {getPlanIcon(subscription?.plan || 'free')}
              <Text style={styles.planHeroTitle}>
                {subscription?.plan?.toUpperCase() || 'FREE'} PLAN
              </Text>
            </View>
            <Text style={styles.planHeroSubtitle}>
              {subscription?.isActive ? 'Active Subscription' : 'Inactive'}
            </Text>
            {subscription?.plan !== 'free' && (
              <View style={styles.planHeroStats}>
                <View style={styles.statItem}>
                  <Calendar size={16} color={colors.white} />
                  <Text style={styles.statText}>
                    {subscription?.cancelAtPeriodEnd ? 'Expires' : 'Renews'} Soon
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <TrendingUp size={16} color={colors.white} />
                  <Text style={styles.statText}>Premium Features</Text>
                </View>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.primaryAction}
            onPress={handleUpgrade}
          >
            <LinearGradient
              colors={['#8B5CF6', '#6366F1']}
              style={styles.primaryActionGradient}
            >
              <Zap size={20} color={colors.white} />
              <Text style={styles.primaryActionText}>
                {subscription?.plan === 'free' ? 'Upgrade Plan' : 'Change Plan'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Plan Features</Text>
          <View style={styles.featuresGrid}>
            {getCurrentPlanFeatures().map((feature, index) => (
              <View key={feature.id} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Check size={16} color={colors.white} />
                </View>
                <Text style={styles.featureText}>{feature.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Shield size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.statTitle}>Data Retention</Text>
              <Text style={styles.statValue}>{getDataRetentionText()}</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <TrendingUp size={24} color="#10B981" />
              </View>
              <Text style={styles.statTitle}>Plan Status</Text>
              <Text style={[
                styles.statValue,
                { color: subscription?.isActive ? '#10B981' : '#EF4444' }
              ]}>
                {subscription?.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>

        {/* Billing & Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing & Account</Text>
          <View style={styles.modernActionsList}>
            {subscription?.plan !== 'free' && (
              <TouchableOpacity 
                style={styles.modernActionItem}
                onPress={handleManageBilling}
                disabled={isLoading}
              >
                <View style={styles.actionIconContainer}>
                  <CreditCard size={20} color="#8B5CF6" />
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>Manage Billing</Text>
                  <Text style={styles.actionSubtitle}>Update payment method</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.modernActionItem}
              onPress={handleDownloadInvoices}
              disabled={isLoading}
            >
              <View style={styles.actionIconContainer}>
                <Download size={20} color="#10B981" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Download Invoices</Text>
                <Text style={styles.actionSubtitle}>Get your billing history</Text>
              </View>
            </TouchableOpacity>

            {subscription?.plan !== 'free' && (
              <TouchableOpacity 
                style={styles.modernActionItem}
                onPress={handleCancelSubscription}
                disabled={isLoading}
              >
                <View style={styles.actionIconContainer}>
                  <Shield size={20} color="#EF4444" />
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={[styles.actionTitle, { color: '#EF4444' }]}>
                    Cancel Subscription
                  </Text>
                  <Text style={styles.actionSubtitle}>Cancel at any time</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity style={styles.supportCard}>
            <View style={styles.supportIconContainer}>
              <HelpCircle size={24} color="#8B5CF6" />
            </View>
            <View style={styles.supportContent}>
              <Text style={styles.supportTitle}>Need Help?</Text>
              <Text style={styles.supportText}>
                Get 24/7 support from our team
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Questions? Contact us at support@lyra-ai.com
          </Text>
        </View>
      </ScrollView>

      <SubscriptionUpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
      />
    </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 40,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.midnightBlue,
  },
  content: {
    flex: 1,
  },
  planHero: {
    marginHorizontal: 0,
    marginTop: 0,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  planHeroContent: {
    padding: 24,
  },
  planHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planHeroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginLeft: 8,
  },
  planHeroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  planHeroStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
  },
  quickActions: {
    paddingHorizontal: 0,
    paddingBottom: 20,
  },
  primaryAction: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  section: {
    paddingHorizontal: 0,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.midnightBlue,
    marginBottom: 16,
  },
  featuresGrid: {
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.gray[800],
    flex: 1,
  },
  statsSection: {
    paddingHorizontal: 0,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[600],
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[800],
    textAlign: 'center',
  },
  modernActionsList: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  modernActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: colors.gray[600],
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  supportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 4,
  },
  supportText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 0,
  },
  footerText: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: 'center',
  },
});