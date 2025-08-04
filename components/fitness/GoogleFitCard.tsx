import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useGoogleFit } from '../../hooks/useGoogleFit';
import { Button } from '../ui/Button';
import { colors } from '../../constants/colors';

interface GoogleFitCardProps {
  onSyncComplete?: () => void;
}

export const GoogleFitCard: React.FC<GoogleFitCardProps> = ({ onSyncComplete }) => {
  const {
    isConnected,
    isConnecting,
    isSyncing,
    connectionStatus,
    syncHealth,
    connectGoogleFit,
    disconnectGoogleFit,
    syncGoogleFitData,
    refreshStatus,
  } = useGoogleFit();

  const [showDetails, setShowDetails] = useState(false);

  const handleConnect = async () => {
    try {
      const result = await connectGoogleFit();
      
      if (result.success) {
        Alert.alert(
          'Google Fit Connected!',
          'Your fitness data will now be synced automatically.',
          [{ text: 'OK' }]
        );
        onSyncComplete?.();
      } else {
        Alert.alert(
          'Connection Failed',
          result.error || 'Failed to connect Google Fit. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Connection Error',
        'An unexpected error occurred. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect Google Fit',
      'This will stop syncing your fitness data. Your existing data will remain saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await disconnectGoogleFit();
              
              if (result.success) {
                Alert.alert(
                  'Disconnected',
                  'Google Fit has been disconnected from your account.',
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert(
                  'Disconnect Failed',
                  result.error || 'Failed to disconnect Google Fit.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect Google Fit.');
            }
          }
        }
      ]
    );
  };

  const handleSync = async () => {
    try {
      await syncGoogleFitData(30);
      Alert.alert(
        'Sync Complete',
        'Your Google Fit data has been updated.',
        [{ text: 'OK' }]
      );
      onSyncComplete?.();
    } catch (error) {
      Alert.alert(
        'Sync Failed',
        'Failed to sync Google Fit data. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const getSyncHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#4CAF50';
      case 'degraded': return '#FF9800';
      case 'critical': return '#F44336';
      default: return colors.lightGray;
    }
  };

  const getSyncHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return 'checkmark-circle';
      case 'degraded': return 'warning';
      case 'critical': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isConnected ? ['rgba(76, 175, 80, 0.15)', 'rgba(76, 175, 80, 0.05)'] : ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="fitness" size={24} color={isConnected ? '#4CAF50' : colors.lightGray} />
            </View>
            <View>
              <Text style={styles.title}>Google Fit</Text>
              <Text style={[styles.status, { color: isConnected ? '#4CAF50' : colors.lightGray }]}>
                {isConnected ? 'Connected' : 'Not Connected'}
              </Text>
            </View>
          </View>
          
          <Pressable
            style={styles.expandButton}
            onPress={() => setShowDetails(!showDetails)}
          >
            <Ionicons 
              name={showDetails ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={colors.lightGray} 
            />
          </Pressable>
        </View>

        {showDetails && isConnected && syncHealth && (
          <View style={styles.detailsContainer}>
            <View style={styles.syncHealthContainer}>
              <View style={styles.syncHealthHeader}>
                <Ionicons 
                  name={getSyncHealthIcon(syncHealth.status)} 
                  size={16} 
                  color={getSyncHealthColor(syncHealth.status)} 
                />
                <Text style={[styles.syncHealthText, { color: getSyncHealthColor(syncHealth.status) }]}>
                  Sync Health: {syncHealth.status.charAt(0).toUpperCase() + syncHealth.status.slice(1)}
                </Text>
              </View>
              
              <Text style={styles.successRate}>
                Success Rate: {syncHealth.successRate}%
              </Text>
              
              {syncHealth.lastFullSync && (
                <Text style={styles.lastSync}>
                  Last Sync: {new Date(syncHealth.lastFullSync).toLocaleDateString()}
                </Text>
              )}
              
              {syncHealth.failedDataTypes.length > 0 && (
                <Text style={styles.failedTypes}>
                  Failed: {syncHealth.failedDataTypes.join(', ')}
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.actionsContainer}>
          {!isConnected ? (
            <Button
              title="Connect Google Fit"
              onPress={handleConnect}
              disabled={isConnecting}
              variant="primary"
              size="medium"
              style={styles.actionButton}
              icon={<Ionicons name="link" size={16} color="white" />}
            />
          ) : (
            <View style={styles.connectedActions}>
              <Button
                title={isSyncing ? 'Syncing...' : 'Sync Now'}
                onPress={handleSync}
                disabled={isSyncing}
                variant="secondary"
                size="small"
                style={styles.syncButton}
                icon={<Ionicons name="refresh" size={14} color={colors.midnightBlue} />}
              />
              
              <Button
                title="Disconnect"
                onPress={handleDisconnect}
                variant="ghost"
                size="small"
                style={styles.disconnectButton}
                textStyle={styles.disconnectText}
              />
            </View>
          )}
        </View>

        {isConnected && (
          <View style={styles.dataTypesContainer}>
            <Text style={styles.dataTypesTitle}>Synced Data:</Text>
            <View style={styles.dataTypesList}>
              <Text style={styles.dataType}>• Steps & Distance</Text>
              <Text style={styles.dataType}>• Heart Rate</Text>
              <Text style={styles.dataType}>• Activities & Workouts</Text>
              <Text style={styles.dataType}>• Sleep Data</Text>
              <Text style={styles.dataType}>• Weight & Body Composition</Text>
            </View>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  gradient: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 2,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  expandButton: {
    padding: 4,
  },
  detailsContainer: {
    marginBottom: 12,
  },
  syncHealthContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
  },
  syncHealthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  syncHealthText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  successRate: {
    fontSize: 12,
    color: colors.lightGray,
    marginBottom: 4,
  },
  lastSync: {
    fontSize: 12,
    color: colors.lightGray,
    marginBottom: 4,
  },
  failedTypes: {
    fontSize: 12,
    color: '#F44336',
  },
  actionsContainer: {
    marginBottom: 12,
  },
  actionButton: {
    width: '100%',
  },
  connectedActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncButton: {
    flex: 1,
    marginRight: 8,
  },
  disconnectButton: {
    paddingHorizontal: 16,
  },
  disconnectText: {
    color: '#F44336',
    fontSize: 14,
  },
  dataTypesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 12,
  },
  dataTypesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 8,
  },
  dataTypesList: {
    gap: 4,
  },
  dataType: {
    fontSize: 12,
    color: colors.lightGray,
  },
}); 