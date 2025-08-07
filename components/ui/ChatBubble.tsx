import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Message } from '@/types';
import { colors } from '@/constants/colors';
import { formatTime } from '@/utils/dateUtils';
import { Mic, Bot, User, Copy, ThumbsUp, ThumbsDown, PiggyBank, Check, X, Sparkles } from 'lucide-react-native';

interface SavingsAction {
  type: 'subscription_cancelled' | 'avoided_purchase' | 'cheaper_alternative' | 'record_savings';
  data: any;
  label: string;
}

interface ChatBubbleProps {
  message: Message;
  onCopy?: (text: string) => void;
  onReaction?: (messageId: string, reaction: 'like' | 'dislike') => void;
  onSavingsAction?: (action: SavingsAction) => void;
  savingsActions?: SavingsAction[];
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  message, 
  onCopy, 
  onReaction,
  onSavingsAction,
  savingsActions
}) => {
  const isUser = message.sender === 'user';

  return (
    <View style={[
      styles.messageRow,
      isUser ? styles.userMessageRow : styles.lyraMessageRow
    ]}>
      {/* Avatar */}
      {!isUser && (
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#8B5CF6', '#6366F1', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.lyraAvatar}
          >
            <Sparkles size={18} color="#FFFFFF" strokeWidth={2.5} />
          </LinearGradient>
        </View>
      )}
      
      <View
        style={[
          styles.container,
          isUser ? styles.userContainer : styles.lyraContainer,
        ]}
      >
        {/* Message Bubble */}
        {isUser ? (
          <LinearGradient
            colors={['#1E293B', '#334155', '#475569']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.bubble, styles.userBubble]}
          >
            {/* Voice Indicator */}
            {message.isVoice && (
              <View style={styles.voiceIndicator}>
                <Mic size={14} color={colors.white} />
                <Text style={[styles.voiceLabel, styles.userVoiceLabel]}>
                  Voice message
                </Text>
              </View>
            )}
            
            {/* Message Text */}
            <Text
              style={[
                styles.messageText,
                styles.userMessageText,
              ]}
            >
              {message.text || ''}
            </Text>
          </LinearGradient>
        ) : (
          <View style={[styles.bubble, styles.lyraBubble]}>
            {/* Voice Indicator */}
            {message.isVoice && (
              <View style={styles.voiceIndicator}>
                <Mic size={14} color={colors.midnightBlue} />
                <Text style={[styles.voiceLabel, styles.lyraVoiceLabel]}>
                  Voice message
                </Text>
              </View>
            )}
            
            {/* Message Text */}
            <Text
              style={[
                styles.messageText,
                styles.lyraMessageText,
              ]}
            >
              {message.text || ''}
            </Text>
          </View>
        )}
        
        {/* Message Footer */}
        <View style={[
          styles.messageFooter,
          isUser ? styles.userMessageFooter : styles.lyraMessageFooter
        ]}>
          <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
          
          {/* Action Buttons for Lyra messages */}
          {!isUser && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onCopy?.(message.text || '')}
              >
                <Copy size={14} color={colors.gray[500]} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onReaction?.(message.id, 'like')}
              >
                <ThumbsUp size={14} color={colors.gray[500]} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onReaction?.(message.id, 'dislike')}
              >
                <ThumbsDown size={14} color={colors.gray[500]} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Savings Action Buttons */}
        {!isUser && savingsActions && savingsActions.length > 0 && (
          <View style={styles.savingsActions}>
            {savingsActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.savingsActionButton}
                onPress={() => onSavingsAction?.(action)}
              >
                <PiggyBank size={16} color={colors.lightPurple} />
                <Text style={styles.savingsActionText}>
                  {action.label}
                </Text>
                <Check size={14} color={colors.lightPurple} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      
      {/* User Avatar */}
      {isUser && (
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#F1F5F9', '#E2E8F0', '#CBD5E1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.userAvatar}
          >
            <User size={18} color={colors.midnightBlue} strokeWidth={2.5} />
          </LinearGradient>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    marginVertical: 8,
    paddingHorizontal: 12,
  },
  userMessageRow: {
    justifyContent: 'flex-end',
    paddingLeft: 50,
  },
  lyraMessageRow: {
    justifyContent: 'flex-start',
    paddingRight: 50,
  },
  avatarContainer: {
    marginTop: 8,
    marginHorizontal: 10,
    flexShrink: 0,
  },
  lyraAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#334155',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  container: {
    flexShrink: 1,
  },
  userContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    maxWidth: '80%',
  },
  lyraContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    maxWidth: '85%',
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    maxWidth: '100%',
  },
  userBubble: {
    borderBottomRightRadius: 6,
    marginLeft: 'auto',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  lyraBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  userMessageText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  lyraMessageText: {
    color: '#1E293B',
    fontWeight: '400',
  },
  voiceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  voiceLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  userVoiceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  lyraVoiceLabel: {
    color: colors.gray[600],
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  userMessageFooter: {
    justifyContent: 'flex-end',
  },
  lyraMessageFooter: {
    justifyContent: 'space-between',
  },
  timestamp: {
    fontSize: 11,
    color: colors.gray[500],
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  savingsActions: {
    marginTop: 12,
    gap: 8,
  },
  savingsActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightPurple + '20',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.lightPurple + '40',
    gap: 6,
  },
  savingsActionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.midnightBlue,
  },
});