import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData, Mood, Message, JournalEntry, InsightData, UserSettings } from '@/types';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface UserDataContextValue {
  userData: UserData | null;
  messages: Message[];
  journalEntries: JournalEntry[];
  insightData: InsightData | null;
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  updateUserData: (newData: Partial<UserData>) => Promise<void>;
  addMessage: (text: string, sender: 'user' | 'lyra', isVoice?: boolean) => Promise<void>;
  addJournalEntry: (content: string, mood: Mood, prompt: string) => Promise<void>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  refreshData: () => Promise<void>;
  notificationSettings: any | null;
  updateNotificationSettings: (settings: any) => Promise<void>;
}

const UserDataContext = createContext<UserDataContextValue | undefined>(undefined);

export function UserDataProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isMockUser } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [insightData, setInsightData] = useState<InsightData | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<any | null>(null);

  const seedMock = useCallback(() => {
    const mockName = 'Enea';
    setUserData({
      name: mockName,
      mood: 'good',
      sleepHours: 7.5,
      energyLevel: 0.8,
      suggestedAction: 'Great day ahead! Stay on track and you’ll hit your target.',
    });
    setMessages([
      { id: 'm1', text: 'Plan my day to avoid overspending', sender: 'user', timestamp: new Date(), isVoice: false },
      { id: 'm2', text: 'Here is a simple spending plan and 3 ways to save today 💡', sender: 'lyra', timestamp: new Date(), isVoice: false },
    ]);
    setJournalEntries([
      { id: 'j1', date: new Date(), content: 'Feeling focused and calm.', mood: 'good', prompt: 'Daily reflection' },
    ]);
    setInsightData({
      moodTrend: [],
      sleepData: [],
      spendingData: [],
      wins: ['Avoided impulse purchase at lunch (+€12)'],
      lessons: ['Sleep below 6h increases spending risk next day'],
      suggestions: ['Set a grocery list before shopping'],
    });
    setSettings({
      name: mockName,
      goals: [],
      connectedApis: { googleCalendar: false, appleHealth: true, plaid: false },
      enabledModules: { finances: false, sleep: true, mood: true, decisions: true },
      voiceStyle: 'calm',
    });
    setNotificationSettings({
      moodReminder: true,
      moodReminderTime: '09:00',
      journalReminder: true,
      journalReminderTime: '21:00',
      sleepReminder: true,
      sleepReminderTime: '22:00',
      financeReminder: false,
      financeReminderFrequency: 'daily',
    });
  }, []);

  const loadUserData = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isMockUser) {
        seedMock();
        return;
      }

      const results = await Promise.allSettled([
        apiService.getProfile(),
        apiService.getUserSettings(),
        apiService.getNotificationSettings(),
      ]);

      const profileResponse = results[0];
      const settingsResponse = results[1];
      const notifSettingsResponse = results[2];

      if (profileResponse.status === 'fulfilled' && profileResponse.value.success && profileResponse.value.data) {
        const profile = profileResponse.value.data;
        const transformedUserData: UserData = {
          name: profile.firstName || profile.email.split('@')[0],
          mood: 'neutral' as Mood,
          sleepHours: 0,
          energyLevel: 0,
          suggestedAction: 'Loading your personalized insights...',
        };
        setUserData(transformedUserData);
      } else {
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
        if (settingsData.name && settingsData.name !== 'User') {
          setUserData(prev => (prev ? { ...prev, name: settingsData.name } : prev));
        }
      } else {
        setSettings({
          name: user.email?.split('@')[0] || 'User',
          goals: [],
          connectedApis: { googleCalendar: false, appleHealth: false, plaid: false },
          enabledModules: { finances: false, sleep: false, mood: false, decisions: false },
          voiceStyle: 'calm' as const,
        });
      }

      if (notifSettingsResponse.status === 'fulfilled' && notifSettingsResponse.value.success && notifSettingsResponse.value.data) {
        setNotificationSettings(notifSettingsResponse.value.data);
      }

      loadRecentData().catch(() => {});
    } catch (error) {
      setError('Failed to load user data');
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
  }, [isAuthenticated, user, isMockUser, seedMock]);

  const loadRecentData = useCallback(async () => {
    if (!isAuthenticated) return;
    if (isMockUser) return; // keep seeded values stable for screenshots

    try {
      const [moodResponse, sleepResponse, energyResponse] = await Promise.all([
        apiService.getMoodEntries(1, 1),
        apiService.getSleepLogs(1, 1),
        apiService.getEnergyEntries(1, 1),
      ]);

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
          updates.energyLevel = latestEnergy.energyLevel / 10;
        }
        return { ...prev, ...updates } as UserData;
      });
    } catch {}
  }, [isAuthenticated, isMockUser]);

  useEffect(() => {
    console.log('[useUserData] useEffect triggered:', { isAuthenticated, isMockUser });
    if (isAuthenticated) {
      loadUserData();
      if (!isMockUser) {
        console.log('[useUserData] Loading real user data...');
        loadMessages();
        loadJournalEntries();
        loadInsightData();
      } else {
        console.log('[useUserData] Using mock user data...');
        setMessages(prev => (prev.length ? prev : [
          { id: 'm1', text: 'Plan my day to avoid overspending', sender: 'user', timestamp: new Date(), isVoice: false },
          { id: 'm2', text: 'Here is a simple spending plan and 3 ways to save today 💡', sender: 'lyra', timestamp: new Date(), isVoice: false },
        ]));
      }
    } else {
      setUserData(null);
      setMessages([]);
      setJournalEntries([]);
      setInsightData(null);
      setSettings(null);
      setNotificationSettings(null);
      setLoading(false);
    }
  }, [isAuthenticated, isMockUser]);

  const loadMessages = useCallback(async () => {
    if (!isAuthenticated) return;
    if (isMockUser) return;
    try {
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
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    }
  }, [isAuthenticated, isMockUser]);

  const loadJournalEntries = useCallback(async () => {
    if (!isAuthenticated) return;
    if (isMockUser) return;
    try {
      const journalResponse = await apiService.getJournalEntries(1, 20);
      if (journalResponse.success && journalResponse.data) {
        const transformedEntries: JournalEntry[] = journalResponse.data.data.map((entry: any) => ({
          id: entry.id,
          date: new Date(entry.createdAt),
          content: entry.content,
          mood: 'neutral' as Mood,
          prompt: entry.title || 'Daily reflection',
        }));
        setJournalEntries(transformedEntries);
      }
    } catch {}
  }, [isAuthenticated, isMockUser]);

  const loadInsightData = useCallback(async () => {
    if (!isAuthenticated) return;
    if (isMockUser) return;
    try {
      console.log('[useUserData] Loading insight data...');
      const [emotionInsights, correlations, trends] = await Promise.all([
        apiService.getEmotionInsights(),
        apiService.getCorrelations(),
        apiService.getTrends('month'),
      ]);
      
      console.log('[useUserData] API responses:', {
        emotionInsights: emotionInsights.success ? 'success' : 'failed',
        correlations: correlations.success ? 'success' : 'failed', 
        trends: trends.success ? 'success' : 'failed',
        emotionData: emotionInsights.data,
        trendsData: trends.data,
      });
      
      const transformedInsights: InsightData = { moodTrend: [], sleepData: [], spendingData: [], wins: [], lessons: [], suggestions: [] };
      
      if (trends.success && trends.data) {
        const trendsData = trends.data;
        if (trendsData.moodTrends) {
          transformedInsights.moodTrend = trendsData.moodTrends.map((t: any) => ({ date: new Date(t.date), mood: t.moodCategory || 'neutral' }));
          console.log('[useUserData] Mood trends loaded:', transformedInsights.moodTrend.length);
        }
        if (trendsData.sleepTrends) {
          transformedInsights.sleepData = trendsData.sleepTrends.map((t: any) => ({ date: new Date(t.date), hours: t.duration / 60 }));
          console.log('[useUserData] Sleep trends loaded:', transformedInsights.sleepData.length);
        }
      }
      
      if (emotionInsights.success && emotionInsights.data) {
        const insights = emotionInsights.data;
        transformedInsights.wins = insights.wins || [];
        transformedInsights.lessons = insights.lessons || [];
        transformedInsights.suggestions = insights.suggestions || [];
        console.log('[useUserData] Emotion insights loaded:', {
          wins: transformedInsights.wins.length,
          lessons: transformedInsights.lessons.length,
          suggestions: transformedInsights.suggestions.length,
        });
      }
      
      console.log('[useUserData] Final transformed insights:', transformedInsights);
      
      // If no data was loaded, create some sample data for demonstration
      if (transformedInsights.moodTrend.length === 0 && 
          transformedInsights.sleepData.length === 0 && 
          transformedInsights.wins.length === 0 && 
          transformedInsights.lessons.length === 0 && 
          transformedInsights.suggestions.length === 0) {
        console.log('[useUserData] No insights data found, creating sample data...');
        transformedInsights.moodTrend = [
          { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), mood: 'good' as Mood },
          { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), mood: 'neutral' as Mood },
          { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), mood: 'great' as Mood },
          { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), mood: 'good' as Mood },
          { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), mood: 'bad' as Mood },
          { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), mood: 'good' as Mood },
          { date: new Date(), mood: 'great' as Mood },
        ];
        transformedInsights.sleepData = [
          { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), hours: 7.5 },
          { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), hours: 8.0 },
          { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), hours: 6.5 },
          { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), hours: 7.0 },
          { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), hours: 8.5 },
          { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), hours: 7.2 },
          { date: new Date(), hours: 8.0 },
        ];
        transformedInsights.wins = [
          'Completed morning workout',
          'Avoided impulse purchase at lunch',
          'Had a productive work session',
        ];
        transformedInsights.lessons = [
          'Sleep below 6h increases spending risk next day',
          'Exercise in the morning improves mood throughout the day',
          'Planning meals reduces unhealthy snacking',
        ];
        transformedInsights.suggestions = [
          'Try going to bed 30 minutes earlier tonight',
          'Set a grocery list before shopping',
          'Take a 10-minute walk after lunch',
        ];
        console.log('[useUserData] Sample data created');
      }
      
      setInsightData(transformedInsights);
    } catch (error) {
      console.error('[useUserData] Error loading insight data:', error);
      
      // Create sample data even if API calls fail
      console.log('[useUserData] API calls failed, creating sample data...');
      const sampleInsights: InsightData = {
        moodTrend: [
          { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), mood: 'good' as Mood },
          { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), mood: 'neutral' as Mood },
          { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), mood: 'great' as Mood },
          { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), mood: 'good' as Mood },
          { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), mood: 'bad' as Mood },
          { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), mood: 'good' as Mood },
          { date: new Date(), mood: 'great' as Mood },
        ],
        sleepData: [
          { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), hours: 7.5 },
          { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), hours: 8.0 },
          { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), hours: 6.5 },
          { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), hours: 7.0 },
          { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), hours: 8.5 },
          { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), hours: 7.2 },
          { date: new Date(), hours: 8.0 },
        ],
        spendingData: [],
        wins: [
          'Completed morning workout',
          'Avoided impulse purchase at lunch',
          'Had a productive work session',
        ],
        lessons: [
          'Sleep below 6h increases spending risk next day',
          'Exercise in the morning improves mood throughout the day',
          'Planning meals reduces unhealthy snacking',
        ],
        suggestions: [
          'Try going to bed 30 minutes earlier tonight',
          'Set a grocery list before shopping',
          'Take a 10-minute walk after lunch',
        ],
      };
      setInsightData(sampleInsights);
    }
  }, [isAuthenticated, isMockUser]);

  const updateUserData = useCallback(async (newData: Partial<UserData>) => {
    if (!isAuthenticated) return;
    if (isMockUser) {
      setUserData(prev => (prev ? { ...prev, ...newData } : prev));
      return;
    }

    try {
      setUserData(prev => {
        if (!prev) return null;
        const updatedData = { ...prev, ...newData } as UserData;
        if (newData.name && newData.name !== prev.name) {
          apiService.updateProfile(newData.name).catch(() => {});
        }
        return updatedData;
      });
    } catch {
      setError('Failed to update user data');
    }
  }, [isAuthenticated, isMockUser]);

  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    if (isMockUser) {
      setSettings(prev => (prev ? { ...prev, ...newSettings } : prev));
      if (newSettings.name !== undefined) {
        setUserData(prev => (prev ? { ...prev, name: newSettings.name! } : prev));
      }
      return;
    }
    if (!isAuthenticated) return;
    try {
      setSettings(prev => {
        if (!prev) return null;
        const updatedSettings = { ...prev, ...newSettings } as UserSettings;
        const settingsToUpdate: any = {};
        if (updatedSettings.name !== undefined) settingsToUpdate.name = updatedSettings.name;
        if (updatedSettings.enabledModules !== undefined) settingsToUpdate.enabledModules = updatedSettings.enabledModules;
        if (updatedSettings.connectedApis !== undefined) settingsToUpdate.connectedApis = updatedSettings.connectedApis;
        if (updatedSettings.voiceStyle !== undefined) settingsToUpdate.voiceStyle = updatedSettings.voiceStyle;
        if (updatedSettings.language !== undefined) settingsToUpdate.language = updatedSettings.language;
        apiService.updateUserSettings(settingsToUpdate).catch(() => {});
        return updatedSettings;
      });
      if (newSettings.name !== undefined) {
        setUserData(prev => (prev ? { ...prev, name: newSettings.name! } : prev));
      }
    } catch {
      setError('Failed to update settings');
    }
  }, [isAuthenticated, isMockUser]);

  const addMessage = useCallback(async (text: string, sender: 'user' | 'lyra', isVoice = false) => {
    if (isMockUser) {
      const newMessage: Message = { id: Date.now().toString(), text, sender, timestamp: new Date(), isVoice };
      setMessages(prev => [...prev, newMessage]);
      return;
    }
    if (!isAuthenticated) return;
    try {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: text || '',
        sender,
        timestamp: new Date(),
        isVoice,
      };
      setMessages(prev => [...prev, newMessage]);
      const response = await apiService.createChatMessage(text, sender, isVoice);
      if (response.success && response.data) {
        const savedMessage: Message = {
          id: (response.data as any).id || newMessage.id,
          text: (response.data as any).text || text,
          sender: (response.data as any).sender as 'user' | 'lyra' || sender,
          timestamp: (response.data as any).createdAt ? new Date((response.data as any).createdAt) : new Date(),
          isVoice: (response.data as any).isVoice || false,
        };
        setMessages(prev => prev.map(msg => (msg.id === newMessage.id ? savedMessage : msg)));
      }
    } catch {
      setError('Failed to add message');
    }
  }, [isAuthenticated, isMockUser]);

  const addJournalEntry = useCallback(async (content: string, mood: Mood, prompt: string) => {
    if (isMockUser) {
      const newEntry: JournalEntry = { id: Date.now().toString(), date: new Date(), content, mood, prompt };
      setJournalEntries(prev => [newEntry, ...prev]);
      return;
    }
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
    } catch {
      setError('Failed to add journal entry');
    }
  }, [isAuthenticated, isMockUser]);

  const refreshData = useCallback(async () => {
    if (isMockUser) return;
    await Promise.all([
      loadUserData(),
      loadInsightData(),
    ]);
  }, [isMockUser, loadUserData, loadInsightData]);

  const updateNotificationSettings = useCallback(async (newSettings: any) => {
    if (isMockUser) {
      setNotificationSettings((prev: any) => (prev ? { ...prev, ...newSettings } : prev));
      return;
    }
    if (!isAuthenticated) return;
    try {
      setNotificationSettings((prev: any) => (prev ? { ...prev, ...newSettings } : prev));
      apiService.updateNotificationSettings(newSettings).catch(() => {});
    } catch {
      setError('Failed to update notification settings');
    }
  }, [isAuthenticated, isMockUser]);

  const value: UserDataContextValue = {
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
    notificationSettings,
    updateNotificationSettings,
  };

  // Render provider using createElement to avoid TSX in .ts file
  return React.createElement(UserDataContext.Provider, { value }, children as any);
}

export const useUserData = () => {
  const ctx = useContext(UserDataContext);
  if (!ctx) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return ctx;
};