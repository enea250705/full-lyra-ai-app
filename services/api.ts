import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL.trim().length > 0
  ? process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '')
  : 'https://lyra-backend-xn4o.onrender.com/api/v1');

// Add timeout and additional options for better error handling
const API_TIMEOUT = 30000; // 30 seconds

// Debug environment variable loading
console.log('Environment variable EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
console.log('Using API_BASE_URL:', API_BASE_URL);

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: any[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class ApiService {
  private baseURL = API_BASE_URL;

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('authToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async validateAndRefreshToken(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return false;
      }

      // Try to validate current token
      const response = await this.getProfile();
      if (response.success) {
        return true;
      }
    } catch (error) {
      // Token might be expired, try to refresh
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const refreshResponse = await this.refreshToken(refreshToken);
          if (refreshResponse.success && refreshResponse.data) {
            await AsyncStorage.setItem('authToken', refreshResponse.data.token);
            await AsyncStorage.setItem('refreshToken', refreshResponse.data.refreshToken);
            return true;
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }
    }
    return false;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const fullUrl = `${this.baseURL}${endpoint}`;
      
      console.log(`Making API request to: ${fullUrl}`);
      console.log('Request options:', { ...options, headers });
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
      
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('Invalid response format from server');
      }
      
      console.log('Response data:', data);

      if (!response.ok) {
        console.error('API request failed with status:', response.status);
        console.error('Response data:', data);
        throw new Error(data.error || data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      console.error('Base URL:', this.baseURL);
      console.error('Endpoint:', endpoint);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - server took too long to respond');
        }
        if (error.message.includes('Network request failed')) {
          throw new Error('Network error - please check your internet connection');
        }
        if (error.message.includes('Invalid response format')) {
          throw new Error('Server error - please try again later');
        }
      }
      
      throw error;
    }
  }

  // Authentication API
  async register(email: string, password: string, firstName?: string, lastName?: string) {
    console.log('Attempting registration with:', { email, firstName, lastName, password: '***' });
    return this.request<{
      user: any;
      token: string;
      refreshToken: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
  }

  async login(email: string, password: string) {
    console.log('Attempting login with:', { email, password: '***' });
    return this.request<{
      user: any;
      token: string;
      refreshToken: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async refreshToken(refreshToken: string) {
    return this.request<{
      token: string;
      refreshToken: string;
    }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async deleteAccount() {
    return this.request('/auth/delete-account', {
      method: 'DELETE',
    });
  }

  async getProfile() {
    return this.request<any>('/auth/profile');
  }

  async updateProfile(firstName?: string, lastName?: string) {
    return this.request<any>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ firstName, lastName }),
    });
  }

  // Google OAuth API
  async getGoogleAuthUrl() {
    return this.request<{
      authUrl: string;
      message: string;
    }>('/auth/google');
  }

  async handleGoogleCallback(code: string) {
    return this.request<{
      user: any;
      token: string;
      refreshToken: string;
      googleAccessToken: string;
      googleRefreshToken: string;
    }>('/auth/google/callback', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  // Daily Check-ins API
  async createCheckin(content?: string, moodEmoji?: string, voiceTranscriptionUrl?: string) {
    return this.request<any>('/checkins', {
      method: 'POST',
      body: JSON.stringify({ content, moodEmoji, voiceTranscriptionUrl }),
    });
  }

  async getCheckins(page = 1, limit = 20) {
    return this.request<PaginatedResponse<any>>(`/checkins?page=${page}&limit=${limit}`);
  }

  async getTodayCheckin() {
    return this.request<any>('/checkins/today');
  }

  async updateCheckin(id: string, content?: string, moodEmoji?: string, voiceTranscriptionUrl?: string) {
    return this.request<any>(`/checkins/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content, moodEmoji, voiceTranscriptionUrl }),
    });
  }

  async deleteCheckin(id: string) {
    return this.request(`/checkins/${id}`, {
      method: 'DELETE',
    });
  }

  // Mood Tracking API
  async createMoodEntry(moodValue: number, moodCategory?: string, notes?: string) {
    const isValidToken = await this.validateAndRefreshToken();
    if (!isValidToken) {
      throw new Error('Authentication required');
    }
    
    return this.request<any>('/mood', {
      method: 'POST',
      body: JSON.stringify({ moodValue, moodCategory, notes }),
    });
  }

  async getMoodEntries(page = 1, limit = 20, startDate?: string, endDate?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return this.request<PaginatedResponse<any>>(`/mood?${params}`);
  }

  async getMoodTrends(period = 'week') {
    return this.request<any>(`/mood/trends?period=${period}`);
  }

  async updateMoodEntry(id: string, moodValue: number, moodCategory?: string, notes?: string) {
    const isValidToken = await this.validateAndRefreshToken();
    if (!isValidToken) {
      throw new Error('Authentication required');
    }
    
    return this.request<any>(`/mood/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ moodValue, moodCategory, notes }),
    });
  }

  async deleteMoodEntry(id: string) {
    const isValidToken = await this.validateAndRefreshToken();
    if (!isValidToken) {
      throw new Error('Authentication required');
    }
    
    return this.request(`/mood/${id}`, {
      method: 'DELETE',
    });
  }

  // Energy Tracking API
  async createEnergyEntry(energyLevel: number, energyEmoji?: string, notes?: string) {
    return this.request<any>('/energy', {
      method: 'POST',
      body: JSON.stringify({ energyLevel, energyEmoji, notes }),
    });
  }

  async getEnergyEntries(page = 1, limit = 20, startDate?: string, endDate?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return this.request<PaginatedResponse<any>>(`/energy?${params}`);
  }

  async getEnergyTrends(period = 'week') {
    return this.request<any>(`/energy/trends?period=${period}`);
  }

  // Sleep Tracking API
  async createSleepLog(startTime: string, endTime: string, qualityRating: number, notes?: string) {
    return this.request<any>('/sleep', {
      method: 'POST',
      body: JSON.stringify({ startTime, endTime, qualityRating, notes }),
    });
  }

  async getSleepLogs(page = 1, limit = 20, startDate?: string, endDate?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return this.request<PaginatedResponse<any>>(`/sleep?${params}`);
  }

  async getSleepTrends(period = 'week') {
    return this.request<any>(`/sleep/trends?period=${period}`);
  }

  // Focus Sessions API
  async startFocusSession(goal?: string) {
    return this.request<any>('/focus/start', {
      method: 'POST',
      body: JSON.stringify({ goal }),
    });
  }

  async endFocusSession(id: string, completed = false, distractionCount = 0) {
    return this.request<any>(`/focus/${id}/end`, {
      method: 'POST',
      body: JSON.stringify({ completed, distractionCount }),
    });
  }

  async getFocusSessions(page = 1, limit = 20) {
    return this.request<PaginatedResponse<any>>(`/focus?page=${page}&limit=${limit}`);
  }

  async getActiveFocusSession() {
    return this.request<any>('/focus/active');
  }

  async getFocusStats(period = 'week') {
    return this.request<any>(`/focus/stats?period=${period}`);
  }

  // Journal API
  async createJournalEntry(title?: string, content?: string, voiceUrl?: string, pinProtected = false) {
    return this.request<any>('/journal', {
      method: 'POST',
      body: JSON.stringify({ title, content, voiceUrl, pinProtected }),
    });
  }

  async getJournalEntries(page = 1, limit = 20, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) params.append('search', search);
    
    return this.request<PaginatedResponse<any>>(`/journal?${params}`);
  }

  async getJournalEntry(id: string, pin?: string) {
    const params = pin ? `?pin=${pin}` : '';
    return this.request<any>(`/journal/${id}${params}`);
  }

  async updateJournalEntry(id: string, title?: string, content?: string, voiceUrl?: string, pinProtected?: boolean) {
    return this.request<any>(`/journal/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, content, voiceUrl, pinProtected }),
    });
  }

  async deleteJournalEntry(id: string) {
    return this.request(`/journal/${id}`, {
      method: 'DELETE',
    });
  }

  // Notifications API
  async getNotifications(page = 1, limit = 20, unreadOnly = false) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      unreadOnly: unreadOnly.toString(),
    });
    
    return this.request<PaginatedResponse<any>>(`/notifications?${params}`);
  }

  async markNotificationAsRead(id: string) {
    return this.request<any>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  async getUnreadCount() {
    return this.request<{ count: number }>('/notifications/unread-count');
  }

  async getNotificationSettings() {
    return this.request<any>('/notifications/settings');
  }

  async updateNotificationSettings(settings: any) {
    return this.request<any>('/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Calendar API
  async verifyCalendarConnection() {
    return this.request<any>('/calendar/connect', {
      method: 'POST',
    });
  }

  async getCalendarEvents(timeframe: 'today' | 'tomorrow' | 'week' | 'month' = 'week', maxResults = 50) {
    return this.request<any>(`/calendar/events?timeframe=${timeframe}&maxResults=${maxResults}`);
  }

  // Data export/delete
  async exportUserData() {
    return this.request<any>('/data/export');
  }

  async deleteAllUserData() {
    return this.request<any>('/data/delete', { method: 'DELETE' });
  }

  // Push Notifications (client helpers)
  async saveExpoPushToken(token: string, device?: { os?: string; model?: string }) {
    return this.request<any>('/notifications/tokens', {
      method: 'POST',
      body: JSON.stringify({ expoPushToken: token, platform: device?.os || 'unknown', deviceModel: device?.model }),
    });
  }

  async unregisterPushToken(deviceId: string) {
    return this.request<any>(`/notifications/tokens/${deviceId}`, {
      method: 'DELETE',
    });
  }

  // Settings API
  async getUserSettings() {
    return this.request<any>('/settings');
  }

  async updateUserSettings(settings: any) {
    return this.request<any>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async toggleFeature(feature: string, enabled: boolean) {
    return this.request<any>(`/settings/features/${feature}`, {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
  }

  // Analytics API
  async trackEvent(featureName: string, action: string, metadata?: any) {
    return this.request<any>('/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ featureName, action, metadata }),
    });
  }

  async getUserAnalytics(period = 'week', feature?: string) {
    const params = new URLSearchParams({ period });
    if (feature) params.append('feature', feature);
    
    return this.request<any>(`/analytics/user?${params}`);
  }

  // Insights API
  async getEmotionInsights(regenerate = false) {
    return this.request<any>(`/insights/emotions?regenerate=${regenerate}`);
  }

  async getCorrelations() {
    return this.request<any>('/insights/correlations');
  }

  async getWeeklySummary() {
    return this.request<any>('/insights/weekly-summary');
  }

  async getTrends(period = 'month') {
    return this.request<any>(`/insights/trends?period=${period}`);
  }

  // Weather & Mood API
  async getWeatherData(lat: number, lon: number) {
    return this.request<any>(`/weather-mood/weather?lat=${lat}&lon=${lon}`);
  }

  async correlateMoodWithWeather(mood: number, lat: number, lon: number) {
    return this.request<any>('/weather-mood/correlate', {
      method: 'POST',
      body: JSON.stringify({ mood, lat, lon }),
    });
  }

  async getNearbyExpensiveStores(lat: number, lon: number) {
    return this.request<any>(`/weather-mood/nearby-stores?lat=${lat}&lon=${lon}`);
  }

  async adjustSleepTracking(userId: string, lat: number, lon: number, sleepData?: any) {
    return this.request<any>('/weather-mood/adjust-sleep', {
      method: 'POST',
      body: JSON.stringify({ userId, lat, lon, sleepData }),
    });
  }

  async getComprehensiveLocationData(userId: string, lat: number, lon: number, currentMood: number) {
    return this.request<any>('/weather-mood/comprehensive', {
      method: 'POST',
      body: JSON.stringify({ userId, lat, lon, currentMood }),
    });
  }

  async getTimezoneInfo(lat: number, lon: number) {
    return this.request<any>(`/weather-mood/timezone?lat=${lat}&lon=${lon}`);
  }

  // Subscription & Plans API
  async getSubscription() {
    return this.request<any>('/subscription');
  }

  async getPlans() {
    return this.request<any>('/subscription/plans');
  }

  async createSubscription(planId: string) {
    return this.request<any>('/subscription/create', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  }

  async updateSubscription(planId: string) {
    return this.request<any>('/subscription/update', {
      method: 'PUT',
      body: JSON.stringify({ planId }),
    });
  }

  async cancelSubscription(immediate: boolean = false) {
    return this.request<any>('/subscription/cancel', {
      method: 'DELETE',
      body: JSON.stringify({ immediate }),
    });
  }

  async getCustomerPortal() {
    return this.request<any>('/subscription/portal');
  }

  async checkFeatureAccess(featureId: string) {
    return this.request<any>(`/subscription/feature/${featureId}`);
  }

  // Validate native IAP receipt
  async validateReceipt(receiptData: {
    receipt: string;
    productId: string;
    transactionId: string;
    platform: string;
    purchaseToken?: string;
    packageName?: string;
  }) {
    return this.request<any>('/subscription/validate-receipt', {
      method: 'POST',
      body: JSON.stringify(receiptData),
    });
  }

  // Google Fit API
  async getGoogleFitStatus() {
    return this.request<any>('/google-fit/status');
  }

  async connectGoogleFit(data: {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    scope?: string;
  }) {
    return this.request<any>('/google-fit/connect', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async disconnectGoogleFit() {
    return this.request<any>('/google-fit/disconnect', {
      method: 'POST',
    });
  }

  async syncGoogleFitData(data: { days?: number }) {
    return this.request<any>('/google-fit/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGoogleFitSteps(page = 1, limit = 30, startDate?: string, endDate?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return this.request<any>(`/google-fit/steps?${params.toString()}`);
  }

  async getGoogleFitHeartRate(date?: string) {
    const params = date ? `?date=${date}` : '';
    return this.request<any>(`/google-fit/heart-rate${params}`);
  }

  async getGoogleFitActivities(page = 1, limit = 20, startDate?: string, endDate?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return this.request<any>(`/google-fit/activities?${params.toString()}`);
  }

  async getGoogleFitSleep(page = 1, limit = 30, startDate?: string, endDate?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return this.request<any>(`/google-fit/sleep?${params.toString()}`);
  }

  async getGoogleFitWeight(page = 1, limit = 30, startDate?: string, endDate?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return this.request<any>(`/google-fit/weight?${params.toString()}`);
  }

  async getGoogleFitDashboard() {
    return this.request<any>('/google-fit/dashboard');
  }

  // Health Check
  async healthCheck() {
    return this.request<{ status: string; timestamp: string; service: string; version: string }>('/health');
  }

  // Chat Messages
  async getChatMessages(page = 1, limit = 50) {
    return this.request<{ data: any[]; pagination: any }>(`/chat/messages?page=${page}&limit=${limit}`);
  }

  async createChatMessage(text: string, sender: 'user' | 'lyra', isVoice = false) {
    return this.request('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ text, sender, isVoice }),
    });
  }

  async deleteChatMessages() {
    return this.request('/chat/messages', {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
export default apiService;