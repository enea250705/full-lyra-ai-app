import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { colors } from '@/constants/colors';
import { Mood } from '@/types';
import { MoodPicker } from './MoodPicker';
import { VoiceButton } from './VoiceButton';
import { formatDate } from '@/utils/dateUtils';

interface JournalCardProps {
  prompt: string;
  date?: Date;
  initialContent?: string;
  onSave: (content: string, mood: Mood) => void;
  isEditing?: boolean;
}

export const JournalCard: React.FC<JournalCardProps> = ({
  prompt,
  date = new Date(),
  initialContent = '',
  onSave,
  isEditing = true,
}) => {
  const [content, setContent] = useState(initialContent);
  const [mood, setMood] = useState<Mood>('neutral');

  const handleVoiceInput = (text: string) => {
    setContent((prev) => prev + (prev ? ' ' : '') + text);
  };

  const handleSave = () => {
    if (content.trim()) {
      onSave(content, mood);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(date)}</Text>
        <Text style={styles.prompt}>{prompt}</Text>
      </View>

      <View style={styles.contentContainer}>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={content}
            onChangeText={setContent}
            placeholder="Write your thoughts here..."
            multiline
            textAlignVertical="top"
          />
        ) : (
          <Text style={styles.content}>{content}</Text>
        )}
      </View>

      {isEditing && (
        <>
          <MoodPicker initialMood={mood} onMoodChange={setMood} />
          
          <View style={styles.actions}>
            <View style={styles.voiceButtonContainer}>
              <VoiceButton onRecordingComplete={handleVoiceInput} size="small" />
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.saveButtonPressed,
              ]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save Entry</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: colors.gray[400],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginBottom: 16,
  },
  date: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 4,
  },
  prompt: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.midnightBlue,
  },
  contentContainer: {
    minHeight: 120,
    marginBottom: 16,
  },
  input: {
    fontSize: 16,
    color: colors.gray[800],
    lineHeight: 24,
    padding: 12,
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    minHeight: 120,
  },
  content: {
    fontSize: 16,
    color: colors.gray[800],
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  voiceButtonContainer: {
    marginRight: 16,
  },
  saveButton: {
    backgroundColor: colors.midnightBlue,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    alignItems: 'center',
  },
  saveButtonPressed: {
    opacity: 0.8,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});