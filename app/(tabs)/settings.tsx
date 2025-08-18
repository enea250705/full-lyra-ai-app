import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Button } from '../../components/ui/Button';
import { HealthKitPermissionCard } from '../../components/ui/HealthKitPermissionCard';
import { SleepTrackingModeCard } from '../../components/ui/SleepTrackingModeCard';
import SubscriptionUpgradeModal from '../../components/ui/SubscriptionUpgradeModal';
import SafeLoadingScreen from '../../components/ui/SafeLoadingScreen';
import { useUserData } from '../../hooks/useUserData';
import { useSleep } from '../../hooks/useSleep';
import { useNativeSubscription } from '../../hooks/useNativeSubscription';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../constants/colors';
import { User, Calendar, Activity, DollarSign, Trash2, Download, VolumeX, Volume1, Volume2, Crown, Moon, Lock, Bell } from 'lucide-react-native';
import { useI18n } from '../../i18n';
import { apiService } from '../../services/api';
import * as WebBrowser from 'expo-web-browser';
import { useGoogleFit } from '../../hooks/useGoogleFit';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings, loading: userDataLoading, notificationSettings, updateNotificationSettings } = useUserData();
  const { t, languages, setLocale, locale } = useI18n();
  const googleFit = useGoogleFit();
  const { 
    healthKitAvailable, 
    healthKitEnabled, 
    enableHealthKitTracking, 
    isLoading 
  } = useSleep();
  const {
    isProActive,
    isPremiumActive,
    isFree,
    currentPlan
  } = useNativeSubscription();
  const { user, deleteAccount } = useAuth();
  
  // Debug logging for developer override
  console.log('[Settings] User email:', user?.email);
  console.log('[Settings] isDeveloperAccount:', user?.email === 'eneamuja87@gmail.com');
  console.log('[Settings] Subscription status:', { isProActive, isPremiumActive, isFree, currentPlan });
  
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
  
  // Debug logging
  console.log('Settings from useUserData:', settings);
  console.log('Settings type:', typeof settings);
  
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

  // Define which features require which subscription tiers
  const featureRequirements = {
    // Free features (no restriction)
    mood: 'free',
    
    // Pro features  
    finances: 'pro',
    calendar_sync: 'pro',
    savings_tracking: 'pro',
    basic_ai_coaching: 'pro',
    
    // Premium features
    advanced_sleep_analysis: 'premium',
    location_alerts: 'premium',
    sms_alerts: 'premium',
    crisis_support: 'premium',
  };

  // Check if user can access a feature
  const canAccessFeature = (requiredTier: string) => {
    if (requiredTier === 'free') return true;
    if (requiredTier === 'pro') return isProActive || isPremiumActive;
    if (requiredTier === 'premium') return isPremiumActive;
    return true;
  };

  // Show upgrade modal for restricted features
  const showUpgradeModal = (featureId: string, featureName: string) => {
    setUpgradeContext({ featureId, featureName });
    setUpgradeModalVisible(true);
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

  const handleSaveName = () => {
    if (name.trim()) {
      updateSettings({ name: name.trim() });
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
    // Navigate to sleep entry screen or show modal
    Alert.alert(
      'Manual Sleep Entry',
      'This would open a manual sleep entry form in a real app.',
      [{ text: 'OK' }]
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
              
              {!healthKitEnabled && (
                <HealthKitPermissionCard
                  onRequestPermission={handleEnableHealthKit}
                  isLoading={isLoading}
                />
              )}
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
        <Text style={styles.sectionTitle}>{t('settings.subscription')}</Text>
        <Pressable style={styles.subscriptionButton} onPress={handleManageSubscription}>
          <View style={styles.settingLabelContainer}>
            <Crown size={20} color={colors.lightPurple} />
            <Text style={styles.settingLabel}>{t('settings.manage_subscription')}</Text>
          </View>
          <Text style={styles.subscriptionSubtext}>{t('settings.plans_billing')}</Text>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.api_connections')}</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Calendar size={20} color={colors.midnightBlue} />
            <Text style={styles.settingLabel}>{t('settings.google_calendar')}</Text>
            {!canAccessFeature('pro') && (
              <View style={styles.lockIconContainer}>
                <Lock size={14} color={colors.gray[400]} />
              </View>
            )}
          </View>
          <Switch
            value={safeSettings.connectedApis.googleCalendar}
            onValueChange={() => handleToggleApi('googleCalendar')}
            trackColor={{ false: colors.gray[300], true: colors.lightPurple }}
            thumbColor={safeSettings.connectedApis.googleCalendar ? colors.midnightBlue : colors.gray[100]}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Activity size={20} color={colors.midnightBlue} />
            <Text style={styles.settingLabel}>{t('settings.apple_health')}</Text>
            {!canAccessFeature('premium') && (
              <View style={styles.lockIconContainer}>
                <Lock size={14} color={colors.gray[400]} />
              </View>
            )}
          </View>
          <Switch
            value={safeSettings.connectedApis.appleHealth}
            onValueChange={() => handleToggleApi('appleHealth')}
            trackColor={{ false: colors.gray[300], true: colors.lightPurple }}
            thumbColor={safeSettings.connectedApis.appleHealth ? colors.midnightBlue : colors.gray[100]}
          />
        </View>
        {/* Google Fit status & actions (Android parity) */}
        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Activity size={20} color={colors.midnightBlue} />
            <Text style={styles.settingLabel}>Google Fit</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              title={googleFit.isConnected ? 'Disconnect' : (googleFit.isConnecting ? 'Connecting...' : 'Connect')}
              onPress={async () => {
                if (googleFit.isConnected) {
                  await googleFit.disconnectGoogleFit();
                } else {
                  await googleFit.connectGoogleFit();
                }
                await googleFit.refreshStatus();
              }}
              variant="outline"
            />
            <Button
              title={googleFit.isSyncing ? 'Syncing...' : 'Sync Now'}
              onPress={async () => { await googleFit.syncGoogleFitData(30); await googleFit.refreshStatus(); }}
              variant="outline"
            />
          </View>
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <DollarSign size={20} color={colors.midnightBlue} />
            <Text style={styles.settingLabel}>{t('settings.plaid')}</Text>
            {!canAccessFeature('pro') && (
              <View style={styles.lockIconContainer}>
                <Lock size={14} color={colors.gray[400]} />
              </View>
            )}
          </View>
          <Switch
            value={safeSettings.connectedApis.plaid}
            onValueChange={() => handleToggleApi('plaid')}
            trackColor={{ false: colors.gray[300], true: colors.lightPurple }}
            thumbColor={safeSettings.connectedApis.plaid ? colors.midnightBlue : colors.gray[100]}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.enabled_modules')}</Text>
        
        {Object.entries(safeSettings.enabledModules).map(([key, value]) => {
          const isFinances = key === 'finances';
          const requiresUpgrade = isFinances && !canAccessFeature('pro');
          
          return (
            <View key={key} style={styles.settingItem}>
              <View style={styles.settingLabelContainer}>
                <Text style={styles.settingLabel}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
                {requiresUpgrade && (
                  <View style={styles.lockIconContainer}>
                    <Lock size={14} color={colors.gray[400]} />
                  </View>
                )}
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
        <Text style={styles.sectionTitle}>{t('settings.voice_style')}</Text>
        
        <View style={styles.voiceStyleContainer}>
          <Pressable
            style={[
              styles.voiceStyleOption,
              safeSettings.voiceStyle === 'calm' && styles.voiceStyleSelected,
            ]}
            onPress={() => handleSetVoiceStyle('calm')}
          >
            <VolumeX size={24} color={safeSettings.voiceStyle === 'calm' ? colors.white : colors.midnightBlue} />
            <Text style={[
              styles.voiceStyleText,
              safeSettings.voiceStyle === 'calm' && styles.voiceStyleTextSelected,
            ]}>
              {t('settings.voice_calm')}
            </Text>
          </Pressable>
          
          <Pressable
            style={[
              styles.voiceStyleOption,
              safeSettings.voiceStyle === 'energetic' && styles.voiceStyleSelected,
            ]}
            onPress={() => handleSetVoiceStyle('energetic')}
          >
            <Volume2 size={24} color={safeSettings.voiceStyle === 'energetic' ? colors.white : colors.midnightBlue} />
            <Text style={[
              styles.voiceStyleText,
              safeSettings.voiceStyle === 'energetic' && styles.voiceStyleTextSelected,
            ]}>
              {t('settings.voice_energetic')}
            </Text>
          </Pressable>
          
          <Pressable
            style={[
              styles.voiceStyleOption,
              safeSettings.voiceStyle === 'minimal' && styles.voiceStyleSelected,
            ]}
            onPress={() => handleSetVoiceStyle('minimal')}
          >
            <Volume1 size={24} color={safeSettings.voiceStyle === 'minimal' ? colors.white : colors.midnightBlue} />
            <Text style={[
              styles.voiceStyleText,
              safeSettings.voiceStyle === 'minimal' && styles.voiceStyleTextSelected,
            ]}>
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