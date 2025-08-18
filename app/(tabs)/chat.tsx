import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatBubble } from '@/components/ui/ChatBubble';
import { VoiceButton } from '@/components/ui/VoiceButton';
import { Button } from '@/components/ui/Button';
import { useUserData } from '@/hooks/useUserData';
import { useSavings } from '@/hooks/useSavings';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionUpgradeModal from '@/components/ui/SubscriptionUpgradeModal';
import { colors } from '@/constants/colors';
import { Send } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import SafeLoadingScreen from '@/components/ui/SafeLoadingScreen';
import { useI18n } from '@/i18n';

export default function ChatScreen() {
  const { messages, addMessage, userData, loading } = useUserData();
  const { recordSavings, fetchSavingsStats } = useSavings();
  const { subscription } = useSubscription();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeContext, setUpgradeContext] = useState<{featureId?: string, featureName?: string}>({});
  const flatListRef = useRef<FlatList>(null);
  const { t } = useI18n();

  useEffect(() => {
    // Scroll to bottom when messages change
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (messageText === '') return;
    
    // Clear input immediately
    setInputText('');
    
    // Add user message immediately
    await addMessage(messageText, 'user');
    
    // Simulate Lyra thinking
    setIsLoading(true);
    
    try {
      // Use real AI chat endpoint
      const base = (process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL.trim().length > 0
        ? process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '')
        : 'https://lyra-backend-xn4o.onrender.com/api/v1');
      const response = await fetch(`${base}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          message: messageText,
          context: {
            mood: userData?.mood || 'neutral',
            sleepHours: userData?.sleepHours || 0,
            energyLevel: userData?.energyLevel || 0,
            isFirstInteraction: messages.length === 0,
            messageHistory: messages.slice(-3).map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.text
            })), // Send last 3 messages for context
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data?.response) {
        const aiResponse = data.data.response;
        
        // Check if an action was executed
        if (data.data.actionExecuted) {
          const actionInfo = data.data.actionExecuted;
          
          // Check if action requires upgrade
          if (actionInfo.requiresUpgrade) {
            setUpgradeContext({
              featureId: 'savings_tracking',
              featureName: `${actionInfo.requiredPlan?.toUpperCase()} Feature`
            });
            setShowUpgradeModal(true);
            await addMessage(actionInfo.message, 'lyra');
            return;
          }
          
          // If action requires confirmation, show confirmation dialog
          if (actionInfo.requiresConfirmation) {
            Alert.alert(
              t('chat.confirm_action_title'),
              aiResponse,
              [
                {
                  text: t('common.cancel'),
                  style: 'cancel',
                  onPress: () => addMessage(t('chat.action_cancelled'), 'lyra'),
                },
                {
                  text: t('common.confirm'),
                  onPress: async () => {
                    try {
                      // Execute the confirmed action
                      const base = (process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL.trim().length > 0
                        ? process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '')
                        : 'https://lyra-backend-xn4o.onrender.com/api/v1');
                      const confirmResponse = await fetch(`${base}/ai/execute-action`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`,
                        },
                        body: JSON.stringify({
                          action: actionInfo.action,
                          parameters: {},
                          confirmed: true,
                        }),
                      });

                      const confirmData = await confirmResponse.json();
                      if (confirmData.success) {
                        await addMessage(confirmData.message || t('chat.action_completed'), 'lyra');
                      } else {
                        await addMessage(t('chat.action_failed'), 'lyra');
                      }
                    } catch (error) {
                      console.error('Action confirmation error:', error);
                      await addMessage(t('chat.action_failed'), 'lyra');
                    }
                  },
                },
              ]
            );
          } else {
            // Action was executed directly, show the response
            await addMessage(aiResponse, 'lyra');
          }
        } else {
          // Regular chat response
          await addMessage(aiResponse, 'lyra');
        }
      } else {
        throw new Error('Invalid response format from AI');
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      
      // Fallback to simple contextual responses if AI fails
      let fallbackResponse = "";
      const lowerText = (messageText || '').toLowerCase();
      
      if (lowerText.includes('mood') || lowerText.includes('feeling')) {
        fallbackResponse = userData?.mood 
          ? t('chat.fallback_mood', { mood: userData.mood })
          : t('chat.fallback_get_started');
      } else if (lowerText.includes('anxious') || lowerText.includes('anxiety')) {
        fallbackResponse = t('chat.fallback_anxiety');
      } else if (lowerText.includes('started') || lowerText.includes('get started')) {
        fallbackResponse = t('chat.fallback_get_started');
      } else {
        fallbackResponse = t('chat.fallback_generic');
      }
      
      await addMessage(fallbackResponse, 'lyra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    Clipboard.setStringAsync(text);
    Alert.alert(t('chat.copied_title'), t('chat.copied_message'));
  };

  const handleReaction = (messageId: string, reaction: 'like' | 'dislike') => {
    // Here you would typically send feedback to your AI service
    Alert.alert(
      t('chat.feedback_title'), 
      t('chat.feedback_message', { reaction })
    );
  };

  const handleSavingsAction = async (action: any) => {
    try {
      setIsLoading(true);
      
      let apiResponse;
      switch (action.type) {
        case 'subscription_cancelled':
          {
            const base = (process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL.trim().length > 0
              ? process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '')
              : 'https://lyra-backend-xn4o.onrender.com/api/v1');
            apiResponse = await fetch(`${base}/ai/execute-action`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`,
            },
            body: JSON.stringify({
              action: 'confirm_subscription_cancelled',
              parameters: action.data,
            }),
          });
          }
          break;
          
        case 'avoided_purchase':
          {
            const base = (process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL.trim().length > 0
              ? process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '')
              : 'https://lyra-backend-xn4o.onrender.com/api/v1');
            apiResponse = await fetch(`${base}/ai/execute-action`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`,
            },
            body: JSON.stringify({
              action: 'confirm_avoided_purchase',
              parameters: action.data,
            }),
          });
          }
          break;
          
        case 'cheaper_alternative':
          {
            const base = (process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL.trim().length > 0
              ? process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '')
              : 'https://lyra-backend-xn4o.onrender.com/api/v1');
            apiResponse = await fetch(`${base}/ai/execute-action`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`,
            },
            body: JSON.stringify({
              action: 'confirm_alternative_used',
              parameters: action.data,
            }),
          });
          }
          break;
          
        default:
          // Fallback to direct savings recording
          await recordSavings({
            amount: action.data.actualAmount || 0,
            reason: action.data.reason || 'AI suggestion followed',
            category: action.data.category || 'other',
            originalAmount: action.data.originalAmount || 0,
            triggerType: 'ai_suggestion',
          });
          break;
      }
      
      if (apiResponse) {
        const data = await apiResponse.json();
        if (data.success) {
          await addMessage(data.data?.message || '🎉 Great job! Your savings have been recorded.', 'lyra');
        } else {
          // Check if error is due to upgrade requirement
          if (data.data && Array.isArray(data.data) && data.data[0]?.upgradeRequired) {
            setUpgradeContext({
              featureId: 'savings_tracking',
              featureName: 'Savings Tracking'
            });
            setShowUpgradeModal(true);
            await addMessage(data.error || 'This feature requires a Pro plan upgrade.', 'lyra');
            return;
          }
          throw new Error(data.error || 'Failed to record savings');
        }
      }
      
      // Refresh savings stats
      await fetchSavingsStats();
      
    } catch (error) {
      console.error('Error handling savings action:', error);
      Alert.alert(
        'Error',
        'Failed to record your savings. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };


  const handleVoiceInput = async (text: string) => {
    await addMessage(text, 'user', true);
    
    // Use the same AI logic as text input
    await handleSendMessage(text);
  };

  const generateSavingsActions = (message: any) => {
    if (message.sender === 'user') return [];
    
    if (!message.text) return [];
    
    const text = (message.text || '').toLowerCase();
    const actions = [];
    
    // Check for subscription suggestions
    if (text.includes('cancel') && text.includes('subscription')) {
      const subscriptionMatch = text.match(/cancel (\w+)/i);
      const amountMatch = text.match(/€(\d+)/);
      
      if (subscriptionMatch) {
        actions.push({
          type: 'subscription_cancelled' as const,
          label: 'I cancelled it ✅',
          data: {
            subscriptionName: subscriptionMatch[1],
            monthlyAmount: amountMatch ? parseFloat(amountMatch[1]) : 10,
            reason: 'Following AI advice'
          }
        });
      }
    }
    
    // Check for cheaper alternative suggestions
    if (text.includes('instead') || text.includes('cheaper') || text.includes('alternative')) {
      const originalMatch = text.match(/€(\d+)/);
      const alternativeMatch = text.match(/€(\d+).*€(\d+)/);
      
      if (alternativeMatch) {
        actions.push({
          type: 'cheaper_alternative' as const,
          label: 'I chose the cheaper option 💰',
          data: {
            originalItem: 'suggested item',
            alternativeUsed: 'cheaper alternative',
            originalPrice: parseFloat(alternativeMatch[1]),
            alternativePrice: parseFloat(alternativeMatch[2]),
            reason: 'Smart money choice'
          }
        });
      }
    }
    
    // Check for avoided purchase suggestions
    if (text.includes('avoid') || text.includes('skip') || text.includes('unnecessary')) {
      const amountMatch = text.match(/€(\d+)/);
      
      if (amountMatch) {
        actions.push({
          type: 'avoided_purchase' as const,
          label: 'I avoided this purchase 🛡️',
          data: {
            itemName: 'suggested item',
            originalAmount: parseFloat(amountMatch[1]),
            reason: 'Following AI advice'
          }
        });
      }
    }
    
    return actions;
  };

  // Show loading state if userData is not available
  if (loading || !userData) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <StatusBar style="dark" />
        <SafeLoadingScreen 
          type="chat"
          size="medium"
          message={t('auth.index.welcome_back_loading')}
          subMessage={t('auth.index.preparing_experience')}
        />
      </KeyboardAvoidingView>
    );
  }

  return (
    <LinearGradient
      colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <StatusBar style="dark" />
        
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatBubble 
              message={item} 
              onCopy={handleCopy}
              onReaction={handleReaction}
              onSavingsAction={handleSavingsAction}
              savingsActions={generateSavingsActions(item)}
            />
          )}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={['#8B5CF6', '#6366F1', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.welcomeAvatar}
              >
                <Text style={styles.welcomeAvatarText}>✨</Text>
              </LinearGradient>
              <Text style={styles.welcomeTitle}>{t('common.app_name')}</Text>
              <Text style={styles.welcomeSubtitle}>
                {t('home.default_focus')}
              </Text>
              <View style={styles.suggestionChips}>
                <TouchableOpacity 
                  style={styles.suggestionChip}
                  onPress={() => handleSendMessage(t('mood.question'))}
                >
                  <Text style={styles.suggestionChipText}>💭 {t('mood.question')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.suggestionChip}
                  onPress={() => handleSendMessage(t('finance.save', { amount: '€50' }))}
                >
                  <Text style={styles.suggestionChipText}>💰 {t('savings.locked_title')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.suggestionChip}
                  onPress={() => handleSendMessage(t('home.todays_focus'))}
                >
                  <Text style={styles.suggestionChipText}>🎯 {t('home.todays_focus')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
        
        <LinearGradient
          colors={['rgba(255,255,255,0.98)', 'rgba(255,255,255,1)']}
          style={styles.inputContainer}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message Lyra..."
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={500}
            />
            
            <View style={styles.inputActions}>
              <VoiceButton onRecordingComplete={handleVoiceInput} size="medium" />
              
              <TouchableOpacity
                onPress={() => handleSendMessage()}
                disabled={inputText.trim() === '' || isLoading}
                style={[styles.sendButton]}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={inputText.trim() === '' || isLoading 
                    ? ['#CBD5E1', '#94A3B8'] 
                    : ['#8B5CF6', '#6366F1']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sendButtonGradient}
                >
                  <Send size={18} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
      
      {isLoading && (
        <View style={styles.typingIndicator}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC']}
            style={styles.typingBubble}
          >
            <View style={styles.typingAnimation}>
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
            </View>
            <Text style={styles.typingText}>{t('common.processing')}</Text>
          </LinearGradient>
        </View>
      )}

      {/* Subscription Upgrade Modal */}
      <SubscriptionUpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureId={upgradeContext.featureId}
        featureName={upgradeContext.featureName}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray[600],
    fontWeight: '500',
  },
  messagesContainer: {
    paddingHorizontal: 6,
    paddingTop: 12,
    paddingBottom: 20,
    flexGrow: 1,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 4,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 16,
    maxHeight: 120,
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: 'top',
    minHeight: 52,
    fontWeight: '400',
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 4,
    paddingBottom: 4,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  typingIndicator: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 90,
    left: 50,
    right: 20,
  },
  typingBubble: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'flex-start',
  },
  typingAnimation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
    opacity: 0.6,
  },
  typingText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },

  // Welcome State Styles
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  welcomeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  welcomeAvatarText: {
    fontSize: 32,
    textAlign: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '400',
  },
  suggestionChips: {
    gap: 12,
    width: '100%',
  },
  suggestionChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  suggestionChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
});