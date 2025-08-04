export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

export interface UserData {
  name: string;
  mood: Mood;
  sleepHours: number;
  energyLevel: number;
  suggestedAction: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'lyra';
  timestamp: Date;
  isVoice?: boolean;
}

export interface JournalEntry {
  id: string;
  date: Date;
  content: string;
  mood: Mood;
  prompt: string;
}

export interface InsightData {
  moodTrend: Array<{date: Date, mood: Mood}>;
  sleepData: Array<{date: Date, hours: number}>;
  spendingData: Array<{category: string, amount: number}>;
  wins: string[];
  lessons: string[];
  suggestions: string[];
}

export interface UserSettings {
  name: string;
  goals: string[];
  connectedApis: {
    googleCalendar: boolean;
    appleHealth: boolean;
    plaid: boolean;
  };
  enabledModules: {
    finances: boolean;
    sleep: boolean;
    mood: boolean;
    decisions: boolean;
  };
  voiceStyle: 'calm' | 'energetic' | 'minimal';
}