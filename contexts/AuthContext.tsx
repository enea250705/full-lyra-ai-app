import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import { googleAuthService } from '../services/googleAuth';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isVerified: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (firstName?: string, lastName?: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
  isMockUser: boolean;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;
  const isMockUser = false; // Disable mock user functionality

  // Load stored auth data on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('user');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verify token is still valid (skip if offline)
        try {
          const response = await apiService.getProfile();
          if (response.success && response.data) {
            setUser(response.data);
            return; // Token is valid, we're done
          }
        } catch (error) {
          console.log('Token validation failed (possibly offline), skipping validation...');
          // If we're offline or backend is down, just use stored data
          return;
        }
        
        // Token validation failed, try to refresh (skip if offline)
        if (refreshToken) {
          try {
            const refreshResponse = await apiService.refreshToken(refreshToken);
            if (refreshResponse.success && refreshResponse.data) {
              await storeAuth(
                refreshResponse.data.token, 
                refreshResponse.data.refreshToken, 
                JSON.parse(storedUser)
              );
              console.log('Token refreshed successfully');
              return; // Token refreshed successfully
            }
          } catch (refreshError) {
            console.log('Token refresh failed (possibly offline), using stored data...');
            // If offline, keep using stored data instead of clearing
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      // Don't clear auth data on error - let user continue with stored data
      // await clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const storeAuth = async (token: string, refreshToken: string, user: User) => {
    try {
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setToken(token);
      setUser(user);
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  };

  const clearAuth = async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.login(email, password);
      
      if (response.success && response.data) {
        await storeAuth(response.data.token, response.data.refreshToken, response.data.user);
        
        // Track login event
        await apiService.trackEvent('auth', 'login');
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.register(email, password, firstName, lastName);
      
      if (response.success && response.data) {
        await storeAuth(response.data.token, response.data.refreshToken, response.data.user);
        
        // Track registration event
        await apiService.trackEvent('auth', 'register');
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      const result = await googleAuthService.signInWithGoogle();
      
      if (result.success) {
        await storeAuth(result.token, result.refreshToken, result.user);
        
        // Track Google login event
        await apiService.trackEvent('auth', 'google_login');
      } else {
        throw new Error('Google authentication failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Call logout API
      await apiService.logout();
      
      // Track logout event
      await apiService.trackEvent('auth', 'logout');
      
      // Clear local auth data
      await clearAuth();
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local auth data even if API call fails
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async () => {
    try {
      setIsLoading(true);
      await apiService.deleteAccount();
      await clearAuth();
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (firstName?: string, lastName?: string) => {
    try {
      const response = await apiService.updateProfile(firstName, lastName);
      
      if (response.success && response.data) {
        const updatedUser = response.data;
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Track profile update event
        await apiService.trackEvent('auth', 'update_profile');
      } else {
        throw new Error(response.error || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const refreshUserData = async () => {
    try {
      const response = await apiService.getProfile();
      
      if (response.success && response.data) {
        const updatedUser = response.data;
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        throw new Error(response.error || 'Failed to refresh user data');
      }
    } catch (error) {
      console.error('Refresh user data error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    loginWithGoogle,
    logout,
    updateProfile,
    refreshUserData,
    isMockUser,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};