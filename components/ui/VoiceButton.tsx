import React, { useState } from 'react';
import { Pressable, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Mic, Square } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface VoiceButtonProps {
  onRecordingComplete: (text: string) => void;
  size?: 'small' | 'medium' | 'large';
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  onRecordingComplete,
  size = 'medium',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePress = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setIsProcessing(true);
      
      try {
        // TODO: Implement actual voice recording and transcription
        // For now, we'll show a user-friendly message
        setIsProcessing(false);
        onRecordingComplete("Voice recording is not yet implemented. Please type your message instead.");
      } catch (error) {
        console.error('Voice recording error:', error);
        setIsProcessing(false);
        onRecordingComplete("Voice recording failed. Please try typing your message instead.");
      }
    } else {
      // Start recording
      setIsRecording(true);
    }
  };

  const getSize = () => {
    switch (size) {
      case 'small':
        return { button: 40, icon: 16 };
      case 'large':
        return { button: 64, icon: 28 };
      default:
        return { button: 52, icon: 22 };
    }
  };

  const sizeValues = getSize();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        {
          width: sizeValues.button,
          height: sizeValues.button,
          backgroundColor: isRecording ? colors.error : colors.midnightBlue,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
      onPress={handlePress}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <ActivityIndicator color={colors.white} size="small" />
      ) : isRecording ? (
        <Square size={sizeValues.icon} color={colors.white} />
      ) : (
        <Mic size={sizeValues.icon} color={colors.white} />
      )}
      {isRecording && <View style={styles.recordingIndicator} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recordingIndicator: {
    position: 'absolute',
    right: -4,
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.white,
  },
});