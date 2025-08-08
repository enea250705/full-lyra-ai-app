import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData, Mood, Message, JournalEntry, InsightData, UserSettings } from '@/types';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export const useUserData = () => {
  const { user, isAuthenticated } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [insightData, setInsightData] = useState<InsightData | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserData = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('[useUserData] Not authenticated or no user, skipping load');
      setLoading(false);
      return;
    }

    try {
      console.log('[useUserData] Starting to load user data...');
      setLoading(true);
      setError(null);

      // Don't set fallback data - wait for real data
      console.log('[useUserData] Waiting for real user data...');

      // Load user profile and settings with better error handling
      console.log('[useUserData] Loading profile and settings...');
      
      const results = await Promise.allSettled([
        apiService.getProfile(),
        apiService.getUserSettings(),
      ]);

      const profileResponse = results[0];
      const settingsResponse = results[1];

      console.log('[useUserData] Profile response:', profileResponse);
      console.log('[useUserData] Settings response:', settingsResponse);

      if (profileResponse.status === 'fulfilled' && profileResponse.value.success && profileResponse.value.data) {
        // Transform profile data to UserData format
        const profile = profileResponse.value.data;
        const transformedUserData: UserData = {
          name: profile.firstName || profile.email.split('@')[0],
          mood: 'neutral' as Mood, // Will be updated from latest mood entry
          sleepHours: 0, // Will be updated from latest sleep data
          energyLevel: 0, // Will be updated from latest energy data
          suggestedAction: 'Loading your personalized insights...',
        };
        setUserData(transformedUserData);
        console.log('[useUserData] Set transformed user data');
      } else {
        console.log('[useUserData] Profile response failed:', profileResponse.status === 'rejected' ? profileResponse.reason : profileResponse.value?.error);
        // Set fallback user data if profile fails
        const fallbackUserData: UserData = {
          name: user.email?.split('@')[0] || 'User',
          mood: 'neutral' as Mood,
          sleepHours: 0,
          energyLevel: 0,
          suggestedAction: 'Welcome to Lyra! Start by checking in with your mood.',
        };
        setUserData(fallbackUserData);
      }

      if (settingsResponse.status === 'fulfilled' && settingsResponse.value.success && settingsResponse.value.data) {
        const settingsData = settingsResponse.value.data;
        setSettings(settingsData);
        console.log('[useUserData] Set settings data');
        
        // Update userData with name from settings if it exists
        if (settingsData.name && settingsData.name !== 'User') {
          setUserData(prev => {
            if (!prev) return null;
            return { ...prev, name: settingsData.name };
          });
        }
      } else {
        console.log('[useUserData] Settings response failed:', settingsResponse.status === 'rejected' ? settingsResponse.reason : settingsResponse.value?.error);
        // Set default settings if settings fail
        setSettings({
          name: user.email?.split('@')[0] || 'User',
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
        });
      }

      // Load recent data to populate dashboard (don't block on this)
      loadRecentData().catch(error => {
        console.error('[useUserData] Error loading recent data:', error);
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load user data');
      // Set fallback data to prevent crashes
      const fallbackUserData: UserData = {
        name: user.email?.split('@')[0] || 'User',
        mood: 'neutral' as Mood,
        sleepHours: 0,
        energyLevel: 0,
        suggestedAction: 'Welcome to Lyra! Start by checking in with your mood.',
      };
      setUserData(fallbackUserData);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadRecentData = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('[useUserData] Not authenticated, skipping recent data load');
      return;
    }

    try {
      console.log('[useUserData] Loading recent data...');
      // Load recent mood, sleep, and energy data
      const [moodResponse, sleepResponse, energyResponse] = await Promise.all([
        apiService.getMoodEntries(1, 1),
        apiService.getSleepLogs(1, 1),
        apiService.getEnergyEntries(1, 1),
      ]);

      // Update userData with latest readings
      setUserData(prev => {
        if (!prev) return null;
        
        const updates: Partial<UserData> = {};
        
        if (moodResponse.success && moodResponse.data?.data?.[0]) {
          const latestMood = moodResponse.data.data[0];
          updates.mood = latestMood.moodCategory || 'neutral';
        }
        
        if (sleepResponse.success && sleepResponse.data?.data?.[0]) {
          const latestSleep = sleepResponse.data.data[0];
          const startTime = new Date(latestSleep.startTime);
          const endTime = new Date(latestSleep.endTime);
          updates.sleepHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        }
        
        if (energyResponse.success && energyResponse.data?.data?.[0]) {
          const latestEnergy = energyResponse.data.data[0];
          updates.energyLevel = latestEnergy.energyLevel / 10; // Convert to 0-1 scale
        }
        
        return { ...prev, ...updates };
      });
    } catch (error) {
      console.error('Error loading recent data:', error);
    }
  }, [isAuthenticated]);

  const loadMessages = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      // Load chat messages from the new API endpoint
      const chatResponse = await apiService.getChatMessages(1, 50);
      
      if (chatResponse.success && chatResponse.data) {
        const transformedMessages: Message[] = chatResponse.data.data.map((message: any) => ({
          id: message.id,
          text: message.text,
          sender: message.sender as 'user' | 'lyra',
          timestamp: new Date(message.createdAt),
          isVoice: message.isVoice || false,
        }));
        
        setMessages(transformedMessages);
        console.log('[useUserData] Loaded chat messages:', transformedMessages.length);
      } else {
        console.log('[useUserData] No chat messages found or API error');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
      setMessages([]);
    }
  }, [isAuthenticated]);

  const loadJournalEntries = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const journalResponse = await apiService.getJournalEntries(1, 20);
      
      if (journalResponse.success && journalResponse.data) {
        const transformedEntries: JournalEntry[] = journalResponse.data.data.map((entry: any) => ({
          id: entry.id,
          date: new Date(entry.createdAt),
          content: entry.content,
          mood: 'neutral' as Mood, // Default mood
          prompt: entry.title || 'Daily reflection',
        }));
        
        setJournalEntries(transformedEntries);
      }
    } catch (error) {
      console.error('Error loading journal entries:', error);
    }
  }, [isAuthenticated]);

  const loadInsightData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const [emotionInsights, correlations, trends] = await Promise.all([
        apiService.getEmotionInsights(),
        apiService.getCorrelations(),
        apiService.getTrends('month'),
      ]);

      // Transform API data to InsightData format
      const transformedInsights: InsightData = {
        moodTrend: [],
        sleepData: [],
        spendingData: [],
        wins: [],
        lessons: [],
        suggestions: [],
      };

      if (trends.success && trends.data) {
        // Transform trends data
        const trendsData = trends.data;
        
        if (trendsData.moodTrends) {
          transformedInsights.moodTrend = trendsData.moodTrends.map((trend: any) => ({
            date: new Date(trend.date),
            mood: trend.moodCategory || 'neutral',
          }));
        }
        
        if (trendsData.sleepTrends) {
          transformedInsights.sleepData = trendsData.sleepTrends.map((trend: any) => ({
            date: new Date(trend.date),
            hours: trend.duration / 60, // Convert minutes to hours
          }));
        }
      }

      if (emotionInsights.success && emotionInsights.data) {
        const insights = emotionInsights.data;
        transformedInsights.wins = insights.wins || [];
        transformedInsights.lessons = insights.lessons || [];
        transformedInsights.suggestions = insights.suggestions || [];
      }

      setInsightData(transformedInsights);
    } catch (error) {
      console.error('Error loading insight data:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
      loadMessages();
      loadJournalEntries();
      loadInsightData();
    } else {
      // Clear data when not authenticated
      setUserData(null);
      setMessages([]);
      setJournalEntries([]);
      setInsightData(null);
      setSettings(null);
      setLoading(false);
    }
  }, [isAuthenticated]); // Removed function dependencies to prevent circular updates

  const updateUserData = useCallback(async (newData: Partial<UserData>) => {
    if (!isAuthenticated) return;

    try {
      setUserData(prev => {
        if (!prev) return null;
        const updatedData = { ...prev, ...newData };
        
        // Update profile on server if name changed
        if (newData.name && newData.name !== prev.name) {
          apiService.updateProfile(newData.name).catch(error => {
            console.error('Error updating profile:', error);
          });
        }
        
        return updatedData;
      });
    } catch (error) {
      console.error('Error updating user data:', error);
      setError('Failed to update user data');
    }
  }, [isAuthenticated]);

  const addMessage = useCallback(async (text: string, sender: 'user' | 'lyra', isVoice = false) => {
    if (!isAuthenticated) return;

    try {
      // Create message locally first for immediate UI update
      const newMessage: Message = {
        id: Date.now().toString(),
        text: text || '',
        sender,
        timestamp: new Date(),
        isVoice,
      };
      
      // Add message to local state immediately
      setMessages(prev => [...prev, newMessage]);
      
      // Save message to backend
      const response = await apiService.createChatMessage(text, sender, isVoice);
      
      if (response.success && response.data) {
        // Update the message with the real ID from the backend
        const savedMessage: Message = {
          id: (response.data as any).id || newMessage.id,
          text: (response.data as any).text || text,
          sender: (response.data as any).sender as 'user' | 'lyra' || sender,
          timestamp: (response.data as any).createdAt ? new Date((response.data as any).createdAt) : new Date(),
          isVoice: (response.data as any).isVoice || false,
        };
        
        // Replace the temporary message with the saved one
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? savedMessage : msg
        ));
        
        console.log('[useUserData] Message saved to backend:', savedMessage.id);
      } else {
        console.error('[useUserData] Failed to save message to backend:', response.error);
        // Keep the local message even if backend save fails
      }
    } catch (error) {
      console.error('Error adding message:', error);
      // Don't remove the message from state if there's an error
      setError('Failed to add message');
    }
  }, [isAuthenticated]);

  const addJournalEntry = useCallback(async (content: string, mood: Mood, prompt: string) => {
    if (!isAuthenticated) return;

    try {
      const response = await apiService.createJournalEntry(prompt, content);
      
      if (response.success && response.data) {
        const newEntry: JournalEntry = {
          id: response.data.id,
          date: new Date(response.data.createdAt),
          content,
          mood,
          prompt,
        };
        
        setJournalEntries(prev => [newEntry, ...prev]);
      }
    } catch (error) {
      console.error('Error adding journal entry:', error);
      setError('Failed to add journal entry');
    }
  }, [isAuthenticated]);

  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    if (!isAuthenticated) return;

    try {
      setSettings(prev => {
        if (!prev) return null;
        const updatedSettings = { ...prev, ...newSettings };
        
        // Update settings on server (only send allowed fields per API schema)
        const settingsToUpdate: any = {};
        
        // Manually check and copy allowed fields
        if (updatedSettings.name !== undefined) {
          settingsToUpdate.name = updatedSettings.name;
        }
        if (updatedSettings.enabledModules !== undefined) {
          settingsToUpdate.enabledModules = updatedSettings.enabledModules;
        }
        if (updatedSettings.connectedApis !== undefined) {
          settingsToUpdate.connectedApis = updatedSettings.connectedApis;
        }
        if (updatedSettings.voiceStyle !== undefined) {
          settingsToUpdate.voiceStyle = updatedSettings.voiceStyle;
        }
        apiService.updateUserSettings(settingsToUpdate).catch(error => {
          console.error('Error updating settings on server:', error);
        });
        
        return updatedSettings;
      });

      // Also update userData if name is being changed
      if (newSettings.name !== undefined) {
        setUserData(prev => {
          if (!prev) return null;
          return { ...prev, name: newSettings.name! };
        });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Failed to update settings');
    }
  }, [isAuthenticated]);

  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;
    await loadUserData();
    await loadMessages();
    await loadJournalEntries();
    await loadInsightData();
  }, [isAuthenticated]);

  return {
    userData,
    messages,
    journalEntries,
    insightData,
    settings,
    loading,
    error,
    updateUserData,
    addMessage,
    addJournalEntry,
    updateSettings,
    refreshData,
  };
};