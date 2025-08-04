import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { apiService } from './api';

// Complete the auth session for web browsers
WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration
const GOOGLE_OAUTH_CONFIG = {
  expoClientId: '654683772628-885b6oc444tlgo7g736kb4j5qrqkg20n.apps.googleusercontent.com',
  scopes: ['openid', 'profile', 'email'],
  additionalParameters: {
    include_granted_scopes: 'true',
  },
  responseType: AuthSession.ResponseType.Code,
};

class GoogleAuthService {
  private redirectUri = AuthSession.makeRedirectUri({
    useProxy: true,
    preferLocalhost: true,
  });

  async getGoogleAuthUrl(): Promise<string> {
    try {
      // Get Google OAuth URL from our backend
      const response = await apiService.getGoogleAuthUrl();
      if (response.success && response.data.authUrl) {
        return response.data.authUrl;
      }
      throw new Error('Failed to get Google auth URL from backend');
    } catch (error) {
      console.error('Error getting Google auth URL:', error);
      throw error;
    }
  }

  async initiateGoogleAuth(): Promise<AuthSession.AuthSessionResult> {
    try {
      // Create the auth request
      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_OAUTH_CONFIG.expoClientId,
        scopes: GOOGLE_OAUTH_CONFIG.scopes,
        responseType: GOOGLE_OAUTH_CONFIG.responseType,
        redirectUri: this.redirectUri,
        additionalParameters: GOOGLE_OAUTH_CONFIG.additionalParameters,
      });

      // Discover the auth endpoints
      const discovery = await AuthSession.fetchDiscoveryAsync(
        'https://accounts.google.com/.well-known/openid_configuration'
      );

      // Prompt the user for authentication
      const result = await request.promptAsync(discovery);
      
      return result;
    } catch (error) {
      console.error('Google Auth initiation error:', error);
      throw error;
    }
  }

  async handleGoogleAuthResult(result: AuthSession.AuthSessionResult) {
    try {
      if (result.type === 'success' && result.params.code) {
        // Send the authorization code to our backend
        const authResponse = await apiService.handleGoogleCallback(result.params.code);
        
        if (authResponse.success) {
          return {
            success: true,
            user: authResponse.data.user,
            token: authResponse.data.token,
            refreshToken: authResponse.data.refreshToken,
          };
        } else {
          throw new Error(authResponse.error || 'Google authentication failed');
        }
      } else if (result.type === 'error') {
        throw new Error(result.error?.description || 'Google authentication failed');
      } else {
        throw new Error('Google authentication was cancelled');
      }
    } catch (error) {
      console.error('Error handling Google auth result:', error);
      throw error;
    }
  }

  async signInWithGoogle() {
    try {
      const result = await this.initiateGoogleAuth();
      return await this.handleGoogleAuthResult(result);
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }
}

export const googleAuthService = new GoogleAuthService(); 