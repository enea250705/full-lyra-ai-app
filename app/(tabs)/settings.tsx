import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Button } from '../../components/ui/Button';
import { HealthKitPermissionCard } from '../../components/ui/HealthKitPermissionCard';
import { SleepTrackingModeCard } from '../../components/ui/SleepTrackingModeCard';
import { ManualSleepEntryModal } from '../../components/ui/ManualSleepEntryModal';
import SubscriptionUpgradeModal from '../../components/ui/SubscriptionUpgradeModal';
import SafeLoadingScreen from '../../components/ui/SafeLoadingScreen';
import { useUserData } from '../../hooks/useUserData';
import { useSleep } from '../../hooks/useSleep';
import { useNativeSubscription } from '../../hooks/useNativeSubscription';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../constants/colors';
import { User, Calendar, Activity, DollarSign, Trash2, Download, VolumeX, Volume1, Volume2, Crown, Moon, Lock, Bell, LogOut } from 'lucide-react-native';
import { useI18n } from '../../i18n';
import { apiService } from '../../services/api';
import * as WebBrowser from 'expo-web-browser';
import { FEATURES } from '@/constants/features';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings, loading: userDataLoading, notificationSettings, updateNotificationSettings, refreshData } = useUserData();
  const { t, languages, setLocale, locale } = useI18n();
  const { 
    healthKitAvailable, 
    healthKitEnabled, 
    enableHealthKitTracking, 
    createSleepLog,
    isLoading 
  } = useSleep();
  const {
    isProActive,
    isPremiumActive,
    isFree,
    currentPlan
  } = useNativeSubscription();
  const { user, deleteAccount, logout } = useAuth();
  
  // Provide default settings if null or undefined
  const defaultSettings = {
    name: 'User',
    goals: [],
    connectedApis: {
      googleCalendar: false,
      appleHealth: false,
      plaid: false,
    },
    enabledModules: {
      finances: false,
      sleep: false,
      mood: false,
      decisions: false,
    },
    voiceStyle: 'calm' as const,
  };
  
  const currentSettings = settings || defaultSettings;
  
  // Ensure currentSettings has the expected structure
  const safeSettings = {
    name: currentSettings?.name || 'User',
    goals: currentSettings?.goals || [],
    connectedApis: {
      googleCalendar: currentSettings?.connectedApis?.googleCalendar || false,
      appleHealth: currentSettings?.connectedApis?.appleHealth || false,
      plaid: currentSettings?.connectedApis?.plaid || false,
    },
    enabledModules: {
      finances: currentSettings?.enabledModules?.finances || false,
      sleep: currentSettings?.enabledModules?.sleep || false,
      mood: currentSettings?.enabledModules?.mood || false,
      decisions: currentSettings?.enabledModules?.decisions || false,
    },
    voiceStyle: currentSettings?.voiceStyle || 'calm',
  };
  
  const [name, setName] = useState(safeSettings.name);
  React.useEffect(() => {
    // Keep input in sync with latest saved settings
    if (safeSettings.name && safeSettings.name !== name) {
      setName(safeSettings.name);
    }
  }, [safeSettings.name]);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [upgradeContext, setUpgradeContext] = useState({ featureId: '', featureName: '' });
  const [showManualSleepModal, setShowManualSleepModal] = useState(false);

  // 🚀 LAUNCH VERSION - Everything is FREE for now!
  // Features will be monetized in future versions
  const featureRequirements = {
    // All features are free for initial launch
    mood: 'free',
    finances: 'free',
    calendar_sync: 'free',
    savings_tracking: 'free',
    basic_ai_coaching: 'free',
    advanced_sleep_analysis: 'free',
    location_alerts: 'free',
    sms_alerts: 'free',
    crisis_support: 'free',
  };

  // Check if user can access a feature - ALWAYS TRUE for launch version
  const canAccessFeature = (requiredTier: string) => {
    return true; // 🎉 Everything is free during initial launch!
  };

  // Show upgrade modal for restricted features - DISABLED for launch
  const showUpgradeModal = (featureId: string, featureName: string) => {
    // Disabled for free launch - will be enabled in future versions
    return;
  };
  
  // Show loading state if user data is still loading
  if (userDataLoading) {
    return (
      <ScreenContainer>
        <SafeLoadingScreen 
          type="settings"
          message={t('settings.loading_message')}
          subMessage={t('settings.loading_submessage')}
        />
      </ScreenContainer>
    );
  }

  const handleManageSubscription = () => {
    router.push('/subscription');
  };

  const handleToggleModule = (module: keyof typeof safeSettings.enabledModules) => {
    // Check if trying to enable a restricted feature
    if (!safeSettings.enabledModules[module]) {
      // User is trying to enable the feature - check if they have access
      let requiredTier = 'free';
      let featureName = module;
      
      if (module === 'finances') {
        requiredTier = 'pro';
        featureName = 'Financial Tracking & AI Spending Interventions' as any;
      }
      
      if (!canAccessFeature(requiredTier)) {
        showUpgradeModal(`module_${module}`, featureName);
        return;
      }
    }
    
    updateSettings({
      enabledModules: {
        ...safeSettings.enabledModules,
        [module]: !safeSettings.enabledModules[module],
      },
    });
  };

  const handleToggleApi = (api: keyof typeof safeSettings.connectedApis) => {
    // Check if trying to enable a restricted API
    if (!safeSettings.connectedApis[api]) {
      let requiredTier = 'free';
      let featureName = api;
      
      if (api === 'googleCalendar') {
        requiredTier = 'pro';
        featureName = 'Google Calendar Integration & AI Scheduling' as any;
      } else if (api === 'plaid') {
        requiredTier = 'pro';
        featureName = 'Banking Integration & Real-time Spending Alerts' as any;
      } else if (api === 'appleHealth') {
        requiredTier = 'premium';
        featureName = 'Advanced Health Data Integration' as any;
      }
      
      if (!canAccessFeature(requiredTier)) {
        showUpgradeModal(`api_${api}`, featureName);
        return;
      }
    }
    
    updateSettings({
      connectedApis: {
        ...safeSettings.connectedApis,
        [api]: !safeSettings.connectedApis[api],
      },
    });
  };

  const handleSetVoiceStyle = (style: 'calm' | 'energetic' | 'minimal') => {
    updateSettings({ voiceStyle: style });
  };

  const handleSaveName = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await updateSettings({ name: trimmed });
    } catch (e) {
      console.warn('[Settings] Failed to save name', e);
    }
  };

  const handleExportData = () => {
    apiService.exportUserData()
      .then((resp) => {
        Alert.alert(t('common.success'), t('settings.export_data_message'));
      })
      .catch(() => Alert.alert(t('common.error'), t('common.something_went_wrong')));
  };

  const handleDeleteData = () => {
    Alert.alert(
      t('settings.delete_all_data'),
      t('settings.delete_all_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('settings.delete'), 
          style: 'destructive',
          onPress: () => {
            apiService.deleteAllUserData()
              .then(() => Alert.alert(t('settings.data_deleted'), t('settings.data_deleted_message')))
              .catch(() => Alert.alert(t('common.error'), t('common.something_went_wrong')));
          }
        },
      ]
    );
  };

  const handleEnableHealthKit = async () => {
    try {
      const success = await enableHealthKitTracking();
      if (success) {
        Alert.alert(
          t('settings.health_connected_title'),
          t('settings.health_connected_message'),
          [{ text: t('common.ok') }]
        );
      } else {
        Alert.alert(
          t('settings.health_failed_title'),
          t('settings.health_failed_message'),
          [{ text: t('common.ok') }]
        );
      }
    } catch (error) {
      Alert.alert(
        t('common.error'),
        t('settings.health_error_message'),
        [{ text: t('common.ok') }]
      );
    }
  };

  const handleDisableHealthKit = () => {
    Alert.alert(
      t('settings.disable_health_title'),
      t('settings.disable_health_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.confirm'), 
          onPress: () => {
            updateSettings({
              connectedApis: {
                ...currentSettings.connectedApis,
                appleHealth: false,
              },
            });
          }
        },
      ]
    );
  };

  const handleManualSleepEntry = () => {
    setShowManualSleepModal(true);
  };

  const handleSleepEntrySubmit = async (sleepData: {
    startTime: string;
    endTime: string;
    qualityRating: number;
    notes?: string;
  }) => {
    console.log('[Settings] Submitting sleep entry:', sleepData);
    try {
      // Use the createSleepLog function from useSleep hook
      const result = await createSleepLog(
        sleepData.startTime,
        sleepData.endTime,
        sleepData.qualityRating,
        sleepData.notes
      );
      
      console.log('[Settings] Sleep log creation result:', result);
      
      if (result) {
        // Refresh user data to update sleep hours and insights
        await refreshData();
        
        Alert.alert(
          t('common.success'),
          t('sleep.entry_saved'),
          [{ text: t('common.ok') }]
        );
      } else {
        throw new Error('Failed to create sleep log');
      }
    } catch (error) {
      console.error('[Settings] Error creating sleep log:', error);
      Alert.alert(
        t('common.error'),
        t('sleep.entry_error'),
        [{ text: t('common.ok') }]
      );
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t('settings.logout'),
      t('settings.logout_confirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              Alert.alert(
                t('settings.logout_success'),
                '',
                [{ text: t('common.ok') }]
              );
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert(
                t('settings.logout_error'),
                error instanceof Error ? error.message : 'Unknown error',
                [{ text: t('common.ok') }]
              );
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('settings.title')}</Text>

        {/* Sleep Tracking Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.sleep_tracking')}</Text>
          
          {healthKitAvailable ? (
            <>
              <SleepTrackingModeCard
                isAutoTrackingEnabled={healthKitEnabled}
                isHealthKitAvailable={healthKitAvailable}
                onToggleAutoTracking={healthKitEnabled ? handleDisableHealthKit : handleEnableHealthKit}
                onManualEntry={handleManualSleepEntry}
                isLoading={isLoading}
              />
              
              <HealthKitPermissionCard
                onRequestPermission={handleEnableHealthKit}
                isLoading={isLoading}
                isEnabled={healthKitEnabled}
                onDisable={handleDisableHealthKit}
              />
            </>
          ) : (
            <View style={styles.manualOnlyContainer}>
              <View style={styles.manualOnlyHeader}>
                <Moon size={20} color={colors.midnightBlue} />
                <Text style={styles.manualOnlyTitle}>{t('settings.manual_sleep_title')}</Text>
              </View>
              <Text style={styles.manualOnlyDescription}>
                {t('settings.manual_sleep_desc')}
              </Text>
              <Button
                title={t('settings.log_sleep_manually')}
                onPress={handleManualSleepEntry}
                variant="outline"
                icon={<Moon size={16} color={colors.midnightBlue} />}
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.profile')}</Text>
        <View style={styles.profileContainer}>
          <View style={styles.profileIconContainer}>
            <User size={24} color={colors.midnightBlue} />
          </View>
          <View style={styles.profileInputContainer}>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder={t('settings.your_name')}
              onBlur={handleSaveName}
              onSubmitEditing={handleSaveName}
              returnKeyType="done"
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderWithBadge}>
          <Text style={styles.sectionTitle}>{t('settings.subscription')}</Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </View>
        <Pressable style={styles.subscriptionButton} onPress={() => {
          Alert.alert(
            '🎉 Everything is Free!',
            'All features are currently free during our launch period! Subscription plans will be available in future updates.',
            [{ text: 'Awesome!' }]
          );
        }}>
          <View style={styles.settingLabelContainer}>
            <Crown size={20} color={colors.lightPurple} />
            <Text style={styles.settingLabel}>All Features Free (Launch Special)</Text>
          </View>
          <Text style={styles.subscriptionSubtext}>Enjoy unlimited access during launch</Text>
        </Pressable>
        <Pressable style={[styles.subscriptionButton, { marginTop: 12 }]} onPress={async () => {
          try {
            const result = await apiService.verifyCalendarConnection();
            Alert.alert(
              t('settings.google_calendar'),
              result.success && result.data?.connected ? t('common.success') : t('common.unavailable')
            );
          } catch (e) {
            Alert.alert(t('settings.google_calendar'), t('common.unavailable'));
          }
        }}>
          <View style={styles.settingLabelContainer}>
            <Calendar size={20} color={colors.midnightBlue} />
            <Text style={styles.settingLabel}>{t('settings.google_calendar')}</Text>
          </View>
          <Text style={styles.subscriptionSubtext}>{settings?.connectedApis?.googleCalendar ? t('common.success') : t('common.unavailable')}</Text>
        </Pressable>
      </View>

      {/* API Connections removed for MVP */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.enabled_modules')}</Text>
        
        {Object.entries(safeSettings.enabledModules).map(([key, value]) => {
          // All features are free during launch - no upgrade required
          
          return (
            <View key={key} style={styles.settingItem}>
              <View style={styles.settingLabelContainer}>
                <Text style={styles.settingLabel}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
                {/* Lock removed - all features free during launch */}
              </View>
              <Switch
                value={value}
                onValueChange={() => handleToggleModule(key as keyof typeof safeSettings.enabledModules)}
                trackColor={{ false: colors.gray[300], true: colors.lightPurple }}
                thumbColor={value ? colors.midnightBlue : colors.gray[100]}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderWithBadge}>
          <Text style={styles.sectionTitle}>{t('settings.voice_style')}</Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </View>
        
        <View style={styles.voiceStyleContainer}>
          <Pressable
            style={[
              styles.voiceStyleOption,
              safeSettings.voiceStyle === 'calm' && styles.voiceStyleSelected,
              styles.voiceStyleDisabled,
            ]}
            onPress={() => {
              Alert.alert(
                'Coming Soon! 🎙️',
                'Voice customization will be available in the next update. Stay tuned!',
                [{ text: 'OK' }]
              );
            }}
          >
            <VolumeX size={24} color={colors.gray[400]} />
            <Text style={styles.voiceStyleTextDisabled}>
              {t('settings.voice_calm')}
            </Text>
          </Pressable>
          
          <Pressable
            style={[
              styles.voiceStyleOption,
              styles.voiceStyleDisabled,
            ]}
            onPress={() => {
              Alert.alert(
                'Coming Soon! 🎙️',
                'Voice customization will be available in the next update. Stay tuned!',
                [{ text: 'OK' }]
              );
            }}
          >
            <Volume2 size={24} color={colors.gray[400]} />
            <Text style={styles.voiceStyleTextDisabled}>
              {t('settings.voice_energetic')}
            </Text>
          </Pressable>
          
          <Pressable
            style={[
              styles.voiceStyleOption,
              styles.voiceStyleDisabled,
            ]}
            onPress={() => {
              Alert.alert(
                'Coming Soon! 🎙️',
                'Voice customization will be available in the next update. Stay tuned!',
                [{ text: 'OK' }]
              );
            }}
          >
            <Volume1 size={24} color={colors.gray[400]} />
            <Text style={styles.voiceStyleTextDisabled}>
              {t('settings.voice_minimal')}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('common.notifications') || 'Notifications'}</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Bell size={20} color={colors.midnightBlue} />
            <Text style={styles.settingLabel}>{t('notification.mood_reminder') || 'Mood Reminder'}</Text>
          </View>
          <Switch
            value={!!notificationSettings?.moodReminder}
            onValueChange={(value) => updateNotificationSettings?.({ moodReminder: value })}
            trackColor={{ false: colors.gray[300], true: colors.lightPurple }}
            thumbColor={notificationSettings?.moodReminder ? colors.midnightBlue : colors.gray[100]}
          />
        </View>
        {!!notificationSettings?.moodReminder && (
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t('notification.mood_reminder_time') || 'Reminder Time'}</Text>
            <TextInput
              style={styles.nameInput}
              value={notificationSettings?.moodReminderTime || ''}
              onChangeText={(text) => updateNotificationSettings?.({ moodReminderTime: text })}
              placeholder="09:00"
            />
          </View>
        )}
        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Bell size={20} color={colors.midnightBlue} />
            <Text style={styles.settingLabel}>{t('notification.journal_reminder') || 'Journal Reminder'}</Text>
          </View>
          <Switch
            value={!!notificationSettings?.journalReminder}
            onValueChange={(value) => updateNotificationSettings?.({ journalReminder: value })}
            trackColor={{ false: colors.gray[300], true: colors.lightPurple }}
            thumbColor={notificationSettings?.journalReminder ? colors.midnightBlue : colors.gray[100]}
          />
        </View>
        {!!notificationSettings?.journalReminder && (
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t('notification.journal_reminder_time') || 'Reminder Time'}</Text>
            <TextInput
              style={styles.nameInput}
              value={notificationSettings?.journalReminderTime || ''}
              onChangeText={(text) => updateNotificationSettings?.({ journalReminderTime: text })}
              placeholder="21:00"
            />
          </View>
        )}
        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Bell size={20} color={colors.midnightBlue} />
            <Text style={styles.settingLabel}>{t('notification.sleep_reminder') || 'Sleep Reminder'}</Text>
          </View>
          <Switch
            value={!!notificationSettings?.sleepReminder}
            onValueChange={(value) => updateNotificationSettings?.({ sleepReminder: value })}
            trackColor={{ false: colors.gray[300], true: colors.lightPurple }}
            thumbColor={notificationSettings?.sleepReminder ? colors.midnightBlue : colors.gray[100]}
          />
        </View>
        {!!notificationSettings?.sleepReminder && (
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t('notification.sleep_reminder_time') || 'Reminder Time'}</Text>
            <TextInput
              style={styles.nameInput}
              value={notificationSettings?.sleepReminderTime || ''}
              onChangeText={(text) => updateNotificationSettings?.({ sleepReminderTime: text })}
              placeholder="22:00"
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.data_management')}</Text>
        
        <View style={styles.dataButtonsContainer}>
          <Button
            title={t('settings.export_data')}
            onPress={handleExportData}
            variant="outline"
            icon={<Download size={18} color={colors.midnightBlue} />}
          />
          <Button
            title={t('settings.delete_all_data')}
            onPress={handleDeleteData}
            variant="outline"
            icon={<Trash2 size={18} color={colors.error} />}
          />
          <Button
            title={t('settings.delete') + ' ' + t('profile')}
            onPress={() => {
              Alert.alert(
                t('common.warning') || 'Warning',
                t('settings.delete_all_confirm'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('settings.delete'), style: 'destructive', onPress: async () => {
                    try { await deleteAccount(); } catch {}
                  } }
                ]
              );
            }}
            variant="outline"
          />
        </View>
      </View>

      {/* Language Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        {(() => {
          const flags: Record<string, string> = {
            'en': '🇺🇸',
            'it': '🇮🇹',
            'ja': '🇯🇵',
            'ko': '🇰🇷',
            'ar': '🇸🇦',
            'zh': '🇨🇳',
            'de': '🇩🇪',
            'fr': '🇫🇷',
            'es': '🇲🇽',
            'tr': '🇹🇷',
            'ru': '🇷🇺',
            'pt-BR': '🇧🇷',
          };
          return languages.map((lang) => (
            <Pressable
              key={lang.code}
              style={styles.settingItem}
              onPress={async () => {
                await setLocale(lang.code);
                updateSettings({ language: lang.code as any });
                Alert.alert(
                  t('settings.language_updated_title'),
                  t('settings.language_updated_message', { language: lang.label })
                );
              }}
            >
              <View style={styles.settingLabelContainer}>
                <Text style={styles.flagEmoji}>{flags[lang.code] || '🌐'}</Text>
                <Text style={styles.settingLabel}>{lang.label}</Text>
              </View>
              <Text style={[styles.settingLabel, { color: colors.gray[500] }]}>{locale === lang.code ? '✓' : ''}</Text>
            </Pressable>
          ));
        })()}
      </View>

      {/* Account Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <View style={styles.settingLabelContainer}>
            <LogOut size={20} color={colors.error} />
            <Text style={[styles.settingLabel, { color: colors.error }]}>{t('settings.logout')}</Text>
          </View>
          <Text style={styles.logoutSubtext}>{t('settings.logout_desc')}</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>{t('settings.version', { version: '1.0.0' })}</Text>
        <Text style={styles.copyrightText}>{t('settings.copyright', { year: '2025' })}</Text>
      </View>
      </ScrollView>
      
      <SubscriptionUpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
        featureName={upgradeContext.featureName}
      />
      
      <ManualSleepEntryModal
        visible={showManualSleepModal}
        onClose={() => setShowManualSleepModal(false)}
        onSubmit={handleSleepEntrySubmit}
        isLoading={isLoading}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.midnightBlue,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.midnightBlue,
    marginBottom: 16,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.gray[400],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.softLavender,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInputContainer: {
    flex: 1,
  },
  nameInput: {
    fontSize: 16,
    color: colors.gray[800],
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[300],
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: colors.gray[800],
    marginLeft: 12,
  },
  subscriptionButton: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.gray[400],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  subscriptionSubtext: {
    fontSize: 14,
    color: colors.gray[600],
    marginTop: 4,
    marginLeft: 32,
  },
  logoutButton: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.error,
    shadowColor: colors.gray[400],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutSubtext: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  voiceStyleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  voiceStyleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
  },
  voiceStyleSelected: {
    backgroundColor: colors.midnightBlue,
  },
  voiceStyleText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.midnightBlue,
    marginTop: 8,
  },
  voiceStyleTextSelected: {
    color: colors.white,
  },
  dataButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footer: {
    marginTop: 16,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  copyrightText: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 4,
  },
  lockIconContainer: {
    marginLeft: 8,
    opacity: 0.6,
  },
  flagEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  sectionHeaderWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  comingSoonBadge: {
    backgroundColor: colors.lightPurple,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.white,
  },
  voiceStyleDisabled: {
    opacity: 0.5,
  },
  voiceStyleTextDisabled: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.gray[400],
    marginTop: 8,
  },
  manualOnlyContainer: {
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  manualOnlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  manualOnlyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.midnightBlue,
    marginLeft: 8,
  },
  manualOnlyDescription: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 16,
    lineHeight: 20,
  },
});
