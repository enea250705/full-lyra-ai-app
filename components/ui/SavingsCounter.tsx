import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PiggyBank, TrendingUp, Calendar, Target, Lock, Crown } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface SavingsCounterProps {
  totalSaved: number;
  monthlyTarget?: number;
  monthlySaved?: number;
  onPress?: () => void;
  onUpgradePress?: () => void;
  style?: any;
  userPlan?: 'free' | 'pro' | 'premium';
  hasAccess?: boolean;
}

const SavingsCounter: React.FC<SavingsCounterProps> = ({
  totalSaved = 0,
  monthlyTarget = 100,
  monthlySaved = 0,
  onPress,
  onUpgradePress,
  style,
  userPlan = 'free',
  hasAccess = false,
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  // Animate counter on mount
  useEffect(() => {
    let start = 0;
    const end = totalSaved;
    const duration = 2000; // 2 seconds
    const increment = end / (duration / 16); // 60fps
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setAnimatedValue(end);
        clearInterval(timer);
      } else {
        setAnimatedValue(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [totalSaved]);

  const monthlyProgress = monthlyTarget > 0 ? (monthlySaved / monthlyTarget) * 100 : 0;
  const progressWidth = Math.min(Math.max(monthlyProgress, 5), 100); // Min 5%, max 100%

  // Show upgrade prompt for free users or users without access
  if (!hasAccess || userPlan === 'free') {
    return (
      <Pressable onPress={onUpgradePress} style={[styles.container, style]}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6', '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Lock size={24} color="white" />
              <Text style={styles.headerTitle}>Savings Tracker</Text>
            </View>
            <Crown size={20} color="white" />
          </View>

          {/* Upgrade Message */}
          <View style={styles.upgradeSection}>
            <Text style={styles.upgradeTitle}>Track Your Savings!</Text>
            <Text style={styles.upgradeDescription}>
              See how much money Lyra helps you save with AI-powered spending insights and real-time tracking.
            </Text>
          </View>

          {/* Features Preview */}
          <View style={styles.featuresPreview}>
            <View style={styles.featureRow}>
              <PiggyBank size={16} color="rgba(255, 255, 255, 0.9)" />
              <Text style={styles.featureText}>Real-time savings tracking</Text>
            </View>
            <View style={styles.featureRow}>
              <TrendingUp size={16} color="rgba(255, 255, 255, 0.9)" />
              <Text style={styles.featureText}>Monthly goals & analytics</Text>
            </View>
            <View style={styles.featureRow}>
              <Target size={16} color="rgba(255, 255, 255, 0.9)" />
              <Text style={styles.featureText}>AI spending insights</Text>
            </View>
          </View>

          {/* CTA */}
          <View style={styles.upgradeFooter}>
            <Text style={styles.upgradeButtonText}>
              ✨ Upgrade to Pro - Start Saving Now!
            </Text>
          </View>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={[styles.container, style]}>
      <LinearGradient
        colors={['#10B981', '#059669', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <PiggyBank size={24} color="white" />
            <Text style={styles.headerTitle}>Lyra Saved You</Text>
          </View>
          <TrendingUp size={20} color="white" />
        </View>

        {/* Main Savings Amount */}
        <View style={styles.mainAmount}>
          <Text style={styles.currency}>€</Text>
          <Text style={styles.amount}>{animatedValue.toLocaleString()}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Total</Text>
          </View>
        </View>

        {/* Monthly Progress */}
        <View style={styles.monthlySection}>
          <View style={styles.monthlyHeader}>
            <Calendar size={16} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.monthlyLabel}>This Month: €{monthlySaved}</Text>
            <Target size={16} color="rgba(255, 255, 255, 0.8)" />
          </View>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progressWidth}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {monthlyProgress >= 100 ? '🎉 Goal Reached!' : `${Math.round(monthlyProgress)}% to €${monthlyTarget}`}
            </Text>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.achievements}>
          {totalSaved >= 100 && (
            <View style={styles.achievement}>
              <Text style={styles.achievementEmoji}>🏆</Text>
              <Text style={styles.achievementText}>First €100 saved!</Text>
            </View>
          )}
          
          {totalSaved >= 500 && (
            <View style={styles.achievement}>
              <Text style={styles.achievementEmoji}>💎</Text>
              <Text style={styles.achievementText}>Savings expert!</Text>
            </View>
          )}
          
          {totalSaved >= 1000 && (
            <View style={styles.achievement}>
              <Text style={styles.achievementEmoji}>👑</Text>
              <Text style={styles.achievementText}>Savings master!</Text>
            </View>
          )}
        </View>

        {/* Motivational Message */}
        <View style={styles.footer}>
          <Text style={styles.motivationText}>
            {totalSaved === 0 
              ? "Start your savings journey today!" 
              : totalSaved < 100 
              ? "Great start! Keep it up!" 
              : totalSaved < 500 
              ? "You're building great habits!" 
              : "Amazing progress! You're a saving champion! 🌟"}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  gradient: {
    padding: 20,
    borderRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  mainAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  currency: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginRight: 4,
  },
  amount: {
    fontSize: 48,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  monthlySection: {
    marginBottom: 16,
  },
  monthlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 8,
  },
  monthlyLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBackground: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
    minWidth: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  achievements: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  achievementEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  achievementText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'white',
  },
  footer: {
    alignItems: 'center',
  },
  motivationText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Upgrade styles
  upgradeSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  upgradeDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresPreview: {
    gap: 8,
    marginVertical: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  upgradeFooter: {
    alignItems: 'center',
    marginTop: 8,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
});

export default SavingsCounter;