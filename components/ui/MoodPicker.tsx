import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Mood } from '@/types';
import { colors } from '@/constants/colors';

interface MoodPickerProps {
  initialMood?: Mood;
  onMoodChange: (mood: Mood) => void;
}

const moods: { value: Mood; emoji: string; label: string }[] = [
  { value: 'terrible', emoji: '😞', label: 'Terrible' },
  { value: 'bad', emoji: '😕', label: 'Bad' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'good', emoji: '😊', label: 'Good' },
  { value: 'great', emoji: '😁', label: 'Great' },
];

export const MoodPicker: React.FC<MoodPickerProps> = ({
  initialMood = 'neutral',
  onMoodChange,
}) => {
  const [selectedMood, setSelectedMood] = useState<Mood>(initialMood);

  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood);
    onMoodChange(mood);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>How are you feeling today?</Text>
      <View style={styles.moodContainer}>
        {moods.map((mood) => (
          <Pressable
            key={mood.value}
            style={[
              styles.moodButton,
              selectedMood === mood.value && styles.selectedMood,
            ]}
            onPress={() => handleMoodSelect(mood.value)}
          >
            <Text style={styles.emoji}>{mood.emoji}</Text>
            <Text
              style={[
                styles.moodLabel,
                selectedMood === mood.value && styles.selectedMoodLabel,
              ]}
            >
              {mood.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500' as const,
    marginBottom: 12,
    color: colors.gray[700],
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.gray[100],
    borderRadius: 16,
    padding: 8,
  },
  moodButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    flex: 1,
  },
  selectedMood: {
    backgroundColor: colors.softLavender,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    color: colors.gray[600],
    textAlign: 'center',
  },
  selectedMoodLabel: {
    color: colors.midnightBlue,
    fontWeight: '500' as const,
  },
});