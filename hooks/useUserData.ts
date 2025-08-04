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
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create fallback userData first
      const fallbackUserData: UserData = {
        name: user.firstName || user.email.split('@')[0],
        mood: 'neutral' as Mood,
        sleepHours: 0,
        energyLevel: 0,
        suggestedAction: 'Take a moment to check in with yourself and set your intentions for the day.',
      };
      setUserData(fallbackUserData);

      // Load user profile and settings
      const [profileResponse, settingsResponse] = await Promise.all([
        apiService.getProfile(),
        apiService.getUserSettings(),
      ]);

      if (profileResponse.success && profileResponse.data) {
        // Transform profile data to UserData format
        const profile = profileResponse.data;
        const transformedUserData: UserData = {
          name: profile.firstName || profile.email.split('@')[0],
          mood: 'neutral' as Mood, // Will be updated from latest mood entry
          sleepHours: 0, // Will be updated from latest sleep data
          energyLevel: 0, // Will be updated from latest energy data
          suggestedAction: 'Loading your personalized insights...',
        };
        setUserData(transformedUserData);
      }

      if (settingsResponse.success && settingsResponse.data) {
        setSettings(settingsResponse.data);
      }

      // Load recent data to populate dashboard
      await loadRecentData();
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load user data');
      
      // Keep fallback userData even if API calls fail
      const fallbackUserData: UserData = {
        name: user.firstName || user.email.split('@')[0],
        mood: 'neutral' as Mood,
        sleepHours: 0,
        energyLevel: 0,
        suggestedAction: 'Take a moment to check in with yourself and set your intentions for the day.',
      };
      setUserData(fallbackUserData);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadRecentData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
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
      // Load recent check-ins as messages
      const checkinsResponse = await apiService.getCheckins(1, 20);
      
      if (checkinsResponse.success && checkinsResponse.data) {
        const transformedMessages: Message[] = checkinsResponse.data.data.map((checkin: any) => ({
          id: checkin.id,
          text: checkin.content,
          sender: 'user' as const,
          timestamp: new Date(checkin.createdAt),
          isVoice: false,
        }));
        
        setMessages(transformedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
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
      const newMessage: Message = {
        id: Date.now().toString(),
        text,
        sender,
        timestamp: new Date(),
        isVoice,
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Note: Check-ins are handled separately, not for every chat message
      // to avoid daily limit conflicts
    } catch (error) {
      console.error('Error adding message:', error);
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
        const allowedFields = ['theme', 'aiTone', 'timezone', 'language', 'featuresEnabled'];
        const settingsToUpdate: any = {};
        allowedFields.forEach(field => {
          if (updatedSettings[field] !== undefined) {
            settingsToUpdate[field] = updatedSettings[field];
          }
        });
        apiService.updateUserSettings(settingsToUpdate).catch(error => {
          console.error('Error updating settings on server:', error);
        });
        
        return updatedSettings;
      });
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