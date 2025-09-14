import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { 
  Moon, 
  Clock, 
  Star, 
  XCircle,
  Calendar,
  Save
} from 'lucide-react-native';
import { useI18n } from '@/i18n';
import DateTimePicker from '@react-native-community/datetimepicker';

interface ManualSleepEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (sleepData: {
    startTime: string;
    endTime: string;
    qualityRating: number;
    notes?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export const ManualSleepEntryModal: React.FC<ManualSleepEntryModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const { t } = useI18n();
  
  // Initialize with sensible default times (yesterday evening to this morning)
  const getDefaultStartTime = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1); // Yesterday
    date.setHours(22, 0, 0, 0); // 10 PM
    return date;
  };
  
  const getDefaultEndTime = () => {
    const date = new Date();
    date.setHours(7, 0, 0, 0); // 7 AM today
    return date;
  };
  
  const [startTime, setStartTime] = useState(getDefaultStartTime());
  const [endTime, setEndTime] = useState(getDefaultEndTime());
  const [qualityRating, setQualityRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Reset form when modal becomes visible
  useEffect(() => {
    if (visible) {
      setStartTime(getDefaultStartTime());
      setEndTime(getDefaultEndTime());
      setQualityRating(5);
      setNotes('');
      setShowStartPicker(false);
      setShowEndPicker(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    console.log('[ManualSleepEntryModal] Submitting sleep entry:', {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      qualityRating,
      notes: notes.trim()
    });
    
    if (startTime >= endTime) {
      Alert.alert(
        t('common.error'),
        'End time must be after start time',
        [{ text: t('common.ok') }]
      );
      return;
    }

    try {
      await onSubmit({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        qualityRating,
        notes: notes.trim() || undefined,
      });
      
      // Reset form with default times
      setStartTime(getDefaultStartTime());
      setEndTime(getDefaultEndTime());
      setQualityRating(5);
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error submitting sleep entry:', error);
      Alert.alert(
        t('common.error'),
        'Failed to save sleep entry',
        [{ text: t('common.ok') }]
      );
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const qualityLabels = [
    { value: 1, label: t('sleep.quality_terrible'), color: '#EF4444' },
    { value: 2, label: t('sleep.quality_poor'), color: '#F97316' },
    { value: 3, label: t('sleep.quality_fair'), color: '#EAB308' },
    { value: 4, label: t('sleep.quality_good'), color: '#22C55E' },
    { value: 5, label: t('sleep.quality_excellent'), color: '#10B981' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(255,255,255,0.98)', 'rgba(255,255,255,1)']}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <XCircle size={24} color={colors.midnightBlue} />
            </TouchableOpacity>
            <View style={styles.iconContainer}>
              <Moon size={32} color={colors.midnightBlue} />
            </View>
            <Text style={styles.title}>{t('sleep.manual_entry_title')}</Text>
            <Text style={styles.subtitle}>
              {t('sleep.manual_entry_subtitle')}
            </Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Sleep Times Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('sleep.sleep_times')}</Text>
              
              {/* Start Time */}
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => {
                  console.log('[ManualSleepEntryModal] Start time button pressed');
                  setShowStartPicker(true);
                }}
              >
                <View style={styles.timeButtonContent}>
                  <Clock size={20} color={colors.midnightBlue} />
                  <View style={styles.timeButtonText}>
                    <Text style={styles.timeButtonLabel}>{t('sleep.bedtime')}</Text>
                    <Text style={styles.timeButtonValue}>
                      {formatDate(startTime)} at {formatTime(startTime)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* End Time */}
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => {
                  console.log('[ManualSleepEntryModal] End time button pressed');
                  setShowEndPicker(true);
                }}
              >
                <View style={styles.timeButtonContent}>
                  <Clock size={20} color={colors.midnightBlue} />
                  <View style={styles.timeButtonText}>
                    <Text style={styles.timeButtonLabel}>{t('sleep.wake_time')}</Text>
                    <Text style={styles.timeButtonValue}>
                      {formatDate(endTime)} at {formatTime(endTime)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Sleep Quality Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('sleep.sleep_quality')}</Text>
              <Text style={styles.sectionDescription}>
                {t('sleep.quality_description')}
              </Text>
              
              <View style={styles.qualityContainer}>
                {qualityLabels.map((quality) => (
                  <TouchableOpacity
                    key={quality.value}
                    style={[
                      styles.qualityButton,
                      qualityRating === quality.value && styles.qualityButtonSelected
                    ]}
                    onPress={() => setQualityRating(quality.value)}
                  >
                    <Star 
                      size={16} 
                      color={qualityRating === quality.value ? '#FFFFFF' : quality.color} 
                      fill={qualityRating === quality.value ? '#FFFFFF' : 'none'}
                    />
                    <Text style={[
                      styles.qualityButtonText,
                      qualityRating === quality.value && styles.qualityButtonTextSelected
                    ]}>
                      {quality.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('sleep.notes')}</Text>
              <Text style={styles.sectionDescription}>
                {t('sleep.notes_description')}
              </Text>
              
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder={t('sleep.notes_placeholder')}
                placeholderTextColor={colors.gray[400]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                isLoading && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? [colors.gray[400], colors.gray[500]] : [colors.midnightBlue, colors.deepPurple]}
                style={styles.submitButtonGradient}
              >
                <Save size={16} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>
                  {isLoading ? t('common.saving') : t('sleep.save_entry')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Date/Time Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startTime}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            console.log('[ManualSleepEntryModal] Start time picker onChange:', { event, selectedDate });
            setShowStartPicker(false);
            if (selectedDate) {
              setStartTime(selectedDate);
            }
          }}
          minimumDate={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)} // 7 days ago
          maximumDate={new Date()} // Today
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endTime}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            console.log('[ManualSleepEntryModal] End time picker onChange:', { event, selectedDate });
            setShowEndPicker(false);
            if (selectedDate) {
              setEndTime(selectedDate);
            }
          }}
          minimumDate={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)} // 7 days ago
          maximumDate={new Date()} // Today
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 32,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -20,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.midnightBlue,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    flex: 1,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.midnightBlue,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
    marginBottom: 16,
  },
  timeButton: {
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  timeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeButtonText: {
    marginLeft: 12,
    flex: 1,
  },
  timeButtonLabel: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 2,
  },
  timeButtonValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.midnightBlue,
  },
  qualityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  qualityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: 8,
  },
  qualityButtonSelected: {
    backgroundColor: colors.midnightBlue,
    borderColor: colors.midnightBlue,
  },
  qualityButtonText: {
    fontSize: 14,
    color: colors.gray[700],
    marginLeft: 6,
    fontWeight: '500',
  },
  qualityButtonTextSelected: {
    color: '#FFFFFF',
  },
  notesInput: {
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.midnightBlue,
    borderWidth: 1,
    borderColor: colors.gray[200],
    minHeight: 100,
  },
  buttonContainer: {
    paddingTop: 16,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ManualSleepEntryModal;
