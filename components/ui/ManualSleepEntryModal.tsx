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
  
  // Time input states
  const [startDateInput, setStartDateInput] = useState('');
  const [startTimeInput, setStartTimeInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [endTimeInput, setEndTimeInput] = useState('');

  // Reset form when modal becomes visible
  useEffect(() => {
    if (visible) {
      const defaultStart = getDefaultStartTime();
      const defaultEnd = getDefaultEndTime();
      
      setStartTime(defaultStart);
      setEndTime(defaultEnd);
      setQualityRating(5);
      setNotes('');
      
      // Initialize input fields with consistent format
      const formatDateForInput = (date: Date) => {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      };
      
      const formatTimeForInput = (date: Date) => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      };
      
      setStartDateInput(formatDateForInput(defaultStart));
      setStartTimeInput(formatTimeForInput(defaultStart));
      setEndDateInput(formatDateForInput(defaultEnd));
      setEndTimeInput(formatTimeForInput(defaultEnd));
    }
  }, [visible]);

  const handleSubmit = async () => {
    try {
      // Parse the input fields to create Date objects
      // Convert date format from MM/DD/YYYY to YYYY-MM-DD for proper parsing
      const parseDate = (dateStr: string, timeStr: string) => {
        // Handle different date formats
        let datePart = dateStr;
        if (dateStr.includes('/')) {
          // Convert MM/DD/YYYY to YYYY-MM-DD
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            const month = parts[0].padStart(2, '0');
            const day = parts[1].padStart(2, '0');
            const year = parts[2];
            datePart = `${year}-${month}-${day}`;
          }
        }
        
        // Combine date and time
        const dateTimeStr = `${datePart} ${timeStr}`;
        console.log('[ManualSleepEntryModal] Parsing date string:', dateTimeStr);
        
        const parsedDate = new Date(dateTimeStr);
        if (isNaN(parsedDate.getTime())) {
          throw new Error(`Invalid date: ${dateTimeStr}`);
        }
        return parsedDate;
      };
      
      const startDateTime = parseDate(startDateInput, startTimeInput);
      const endDateTime = parseDate(endDateInput, endTimeInput);
      
      console.log('[ManualSleepEntryModal] Parsed times:', {
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        qualityRating,
        notes: notes.trim()
      });
      
      if (startDateTime >= endDateTime) {
        Alert.alert(
          t('common.error'),
          'End time must be after start time',
          [{ text: t('common.ok') }]
        );
        return;
      }

      await onSubmit({
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        qualityRating,
        notes: notes.trim() || undefined,
      });
      
      // Reset form with default times
      const defaultStart = getDefaultStartTime();
      const defaultEnd = getDefaultEndTime();
      setStartTime(defaultStart);
      setEndTime(defaultEnd);
      setQualityRating(5);
      setNotes('');
      
      // Reset input fields with consistent format
      const formatDateForInput = (date: Date) => {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      };
      
      const formatTimeForInput = (date: Date) => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      };
      
      setStartDateInput(formatDateForInput(defaultStart));
      setStartTimeInput(formatTimeForInput(defaultStart));
      setEndDateInput(formatDateForInput(defaultEnd));
      setEndTimeInput(formatTimeForInput(defaultEnd));
      onClose();
    } catch (error) {
      console.error('Error submitting sleep entry:', error);
      Alert.alert(
        t('common.error'),
        `Failed to save sleep entry: ${error.message}`,
        [{ text: t('common.ok') }]
      );
    }
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
              <View style={styles.timeInputContainer}>
                <Text style={styles.timeInputLabel}>{t('sleep.bedtime')}</Text>
                <View style={styles.timeInputRow}>
                  <TextInput
                    style={styles.dateInput}
                    value={startDateInput}
                    onChangeText={setStartDateInput}
                    placeholder="MM/DD/YYYY"
                    placeholderTextColor={colors.gray[400]}
                  />
                  <TextInput
                    style={styles.timeInput}
                    value={startTimeInput}
                    onChangeText={setStartTimeInput}
                    placeholder="HH:MM"
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>
              </View>

              {/* End Time */}
              <View style={styles.timeInputContainer}>
                <Text style={styles.timeInputLabel}>{t('sleep.wake_time')}</Text>
                <View style={styles.timeInputRow}>
                  <TextInput
                    style={styles.dateInput}
                    value={endDateInput}
                    onChangeText={setEndDateInput}
                    placeholder="MM/DD/YYYY"
                    placeholderTextColor={colors.gray[400]}
                  />
                  <TextInput
                    style={styles.timeInput}
                    value={endTimeInput}
                    onChangeText={setEndTimeInput}
                    placeholder="HH:MM"
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>
              </View>
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
  timeInputContainer: {
    marginBottom: 16,
  },
  timeInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.midnightBlue,
    marginBottom: 8,
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.midnightBlue,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  timeInput: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.midnightBlue,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
});

export default ManualSleepEntryModal;
