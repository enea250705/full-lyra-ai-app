import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Button } from '../../components/ui/Button';
import { HealthKitPermissionCard } from '../../components/ui/HealthKitPermissionCard';
import { SleepTrackingModeCard } from '../../components/ui/SleepTrackingModeCard';
import { useUserData } from '../../hooks/useUserData';
import { useSleep } from '../../hooks/useSleep';
import { colors } from '../../constants/colors';
import { User, Calendar, Activity, DollarSign, Trash2, Download, VolumeX, Volume1, Volume2, Crown, Moon } from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings, loading: userDataLoading } = useUserData();
  const { 
    healthKitAvailable, 
    healthKitEnabled, 
    enableHealthKitTracking, 
    isLoading 
  } = useSleep();
  
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
  
  // Show loading state if user data is still loading
  if (userDataLoading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading settings...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const handleManageSubscription = () => {
    router.push('/subscription');
  };

  const handleToggleModule = (module: keyof typeof safeSettings.enabledModules) => {
    updateSettings({
      enabledModules: {
        ...safeSettings.enabledModules,
        [module]: !safeSettings.enabledModules[module],
      },
    });
  };

  const handleToggleApi = (api: keyof typeof safeSettings.connectedApis) => {
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
    Alert.alert(
      'Export Data',
      'Your data would be exported as a JSON file in a real app.',
      [{ text: 'OK' }]
    );
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete All Data',
      'Are you sure you want to delete all your data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Data Deleted', 'All your data has been deleted.');
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
          'HealthKit Connected',
          'Automatic sleep tracking is now enabled. Your sleep will be detected automatically.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Connection Failed',
          'Could not connect to HealthKit. Please check your permissions in Settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'An error occurred while connecting to HealthKit.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDisableHealthKit = () => {
    Alert.alert(
      'Disable HealthKit',
      'This will stop automatic sleep tracking. You can re-enable it anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disable', 
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
        <Text style={styles.title}>Settings</Text>

        {/* Sleep Tracking Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sleep Tracking</Text>
          
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
                <Text style={styles.manualOnlyTitle}>Manual Sleep Tracking</Text>
              </View>
              <Text style={styles.manualOnlyDescription}>
                HealthKit is not available on this device. You can still track your sleep manually.
              </Text>
              <Button
                title="Log Sleep Manually"
                onPress={handleManualSleepEntry}
                variant="outline"
                icon={<Moon size={16} color={colors.midnightBlue} />}
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.profileContainer}>
          <View style={styles.profileIconContainer}>
            <User size={24} color={colors.midnightBlue} />
          </View>
          <View style={styles.profileInputContainer}>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              onBlur={handleSaveName}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <Pressable style={styles.subscriptionButton} onPress={handleManageSubscription}>
          <View style={styles.settingLabelContainer}>
            <Crown size={20} color={colors.lightPurple} />
            <Text style={styles.settingLabel}>Manage Subscription</Text>
          </View>
          <Text style={styles.subscriptionSubtext}>Plans & Billing</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Connections</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Calendar size={20} color={colors.midnightBlue} />
            <Text style={styles.settingLabel}>Google Calendar</Text>
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
            <Text style={styles.settingLabel}>Apple Health</Text>
          </View>
          <Switch
            value={safeSettings.connectedApis.appleHealth}
            onValueChange={() => handleToggleApi('appleHealth')}
            trackColor={{ false: colors.gray[300], true: colors.lightPurple }}
            thumbColor={safeSettings.connectedApis.appleHealth ? colors.midnightBlue : colors.gray[100]}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <DollarSign size={20} color={colors.midnightBlue} />
            <Text style={styles.settingLabel}>Plaid (Finance)</Text>
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
        <Text style={styles.sectionTitle}>Enabled Modules</Text>
        
        {Object.entries(safeSettings.enabledModules).map(([key, value]) => (
          <View key={key} style={styles.settingItem}>
            <Text style={styles.settingLabel}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
            <Switch
              value={value}
              onValueChange={() => handleToggleModule(key as keyof typeof safeSettings.enabledModules)}
              trackColor={{ false: colors.gray[300], true: colors.lightPurple }}
              thumbColor={value ? colors.midnightBlue : colors.gray[100]}
            />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Voice Style</Text>
        
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
              Calm
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
              Energetic
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
              Minimal
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <View style={styles.dataButtonsContainer}>
          <Button
            title="Export Data"
            onPress={handleExportData}
            variant="outline"
            icon={<Download size={18} color={colors.midnightBlue} />}
          />
          
          <Button
            title="Delete All Data"
            onPress={handleDeleteData}
            variant="outline"
            icon={<Trash2 size={18} color={colors.error} />}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>Lyra v1.0.0</Text>
        <Text style={styles.copyrightText}>© 2025 Lyra AI</Text>
      </View>
      </ScrollView>
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
  manualOnlyContainer: {
    backgroundColor: colors.gray[50],
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