import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { apiService } from './api';

// Complete the auth session for web browsers
WebBrowser.maybeCompleteAuthSession();

// Google Fit OAuth configuration with fitness scopes
const GOOGLE_FIT_OAUTH_CONFIG = {
  expoClientId: '654683772628-885b6oc444tlgo7g736kb4j5qrqkg20n.apps.googleusercontent.com',
  scopes: [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/fitness.heart_rate.read',
    'https://www.googleapis.com/auth/fitness.sleep.read',
    'https://www.googleapis.com/auth/fitness.location.read',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ],
  additionalParameters: {
    include_granted_scopes: 'true',
    access_type: 'offline',
    prompt: 'consent' // Force consent screen to get refresh token
  },
  responseType: AuthSession.ResponseType.Code,
};

export interface GoogleFitAuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
  error?: string;
}

export interface GoogleFitConnectionStatus {
  connected: boolean;
  tokenExpired: boolean;
  scope?: string;
  syncHealth: {
    status: 'healthy' | 'degraded' | 'critical';
    lastFullSync: string | null;
    failedDataTypes: string[];
    staleDataTypes: string[];
    successRate: number;
  };
}

class GoogleFitAuthService {
  private redirectUri = AuthSession.makeRedirectUri({
    useProxy: true,
    preferLocalhost: true,
  });

  /**
   * Check if Google Fit is connected and get status
   */
  async getConnectionStatus(): Promise<GoogleFitConnectionStatus> {
    try {
      const response = await apiService.getGoogleFitStatus();
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to get connection status');
    } catch (error) {
      console.error('Error getting Google Fit connection status:', error);
      throw error;
    }
  }

  /**
   * Initiate Google Fit authentication flow
   */
  async initiateGoogleFitAuth(): Promise<AuthSession.AuthSessionResult> {
    try {
      // Create the auth request with fitness scopes
      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_FIT_OAUTH_CONFIG.expoClientId,
        scopes: GOOGLE_FIT_OAUTH_CONFIG.scopes,
        responseType: GOOGLE_FIT_OAUTH_CONFIG.responseType,
        redirectUri: this.redirectUri,
        additionalParameters: GOOGLE_FIT_OAUTH_CONFIG.additionalParameters,
      });

      // Discover the auth endpoints
      const discovery = await AuthSession.fetchDiscoveryAsync(
        'https://accounts.google.com/.well-known/openid_configuration'
      );

      // Prompt the user for authentication
      const result = await request.promptAsync(discovery);
      
      return result;
    } catch (error) {
      console.error('Google Fit Auth initiation error:', error);
      throw error;
    }
  }

  /**
   * Handle Google Fit authentication result and connect to backend
   */
  async handleGoogleFitAuthResult(result: AuthSession.AuthSessionResult): Promise<GoogleFitAuthResult> {
    try {
      if (result.type === 'success' && result.params.code) {
        // Exchange authorization code for access token
        const tokenResponse = await this.exchangeCodeForTokens(result.params.code);
        
        if (tokenResponse.success && tokenResponse.accessToken) {
          // Connect Google Fit to our backend
          const connectResponse = await apiService.connectGoogleFit({
            accessToken: tokenResponse.accessToken,
            refreshToken: tokenResponse.refreshToken,
            expiresIn: tokenResponse.expiresIn,
            scope: tokenResponse.scope
          });

          if (connectResponse.success) {
            return {
              success: true,
              accessToken: tokenResponse.accessToken,
              refreshToken: tokenResponse.refreshToken,
              expiresIn: tokenResponse.expiresIn,
              scope: tokenResponse.scope
            };
          } else {
            throw new Error(connectResponse.error || 'Failed to connect Google Fit');
          }
        } else {
          throw new Error(tokenResponse.error || 'Failed to get access token');
        }
      } else if (result.type === 'error') {
        throw new Error(result.error?.description || 'Google Fit authentication failed');
      } else {
        throw new Error('Google Fit authentication was cancelled');
      }
    } catch (error) {
      console.error('Error handling Google Fit auth result:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<{
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    scope?: string;
    error?: string;
  }> {
    try {
      const tokenEndpoint = 'https://oauth2.googleapis.com/token';
      
      const params = new URLSearchParams({
        code,
        client_id: GOOGLE_FIT_OAUTH_CONFIG.expoClientId,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      });

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token exchange failed: ${errorData}`);
      }

      const tokenData = await response.json();

      return {
        success: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope
      };
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token exchange failed'
      };
    }
  }

  /**
   * Complete Google Fit authentication flow
   */
  async connectGoogleFit(): Promise<GoogleFitAuthResult> {
    try {
      const result = await this.initiateGoogleFitAuth();
      return await this.handleGoogleFitAuthResult(result);
    } catch (error) {
      console.error('Google Fit connection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Google Fit connection failed'
      };
    }
  }

  /**
   * Disconnect Google Fit
   */
  async disconnectGoogleFit(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiService.disconnectGoogleFit();
      
      if (response.success) {
        return { success: true };
      } else {
        throw new Error(response.error || 'Failed to disconnect Google Fit');
      }
    } catch (error) {
      console.error('Error disconnecting Google Fit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Disconnect failed'
      };
    }
  }

  /**
   * Sync Google Fit data
   */
  async syncGoogleFitData(days: number = 30): Promise<{
    success: boolean;
    syncResults?: any;
    error?: string;
  }> {
    try {
      const response = await apiService.syncGoogleFitData({ days });
      
      if (response.success) {
        return {
          success: true,
          syncResults: response.data.syncResults
        };
      } else {
        throw new Error(response.error || 'Failed to sync Google Fit data');
      }
    } catch (error) {
      console.error('Error syncing Google Fit data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      };
    }
  }

  /**
   * Check if user has granted necessary fitness permissions
   */
  async checkFitnessPermissions(): Promise<{
    hasPermissions: boolean;
    missingScopes: string[];
  }> {
    try {
      const status = await this.getConnectionStatus();
      
      if (!status.connected) {
        return {
          hasPermissions: false,
          missingScopes: GOOGLE_FIT_OAUTH_CONFIG.scopes
        };
      }

      const grantedScopes = status.scope?.split(' ') || [];
      const requiredScopes = GOOGLE_FIT_OAUTH_CONFIG.scopes;
      const missingScopes = requiredScopes.filter(scope => !grantedScopes.includes(scope));

      return {
        hasPermissions: missingScopes.length === 0,
        missingScopes
      };
    } catch (error) {
      console.error('Error checking fitness permissions:', error);
      return {
        hasPermissions: false,
        missingScopes: GOOGLE_FIT_OAUTH_CONFIG.scopes
      };
    }
  }

  /**
   * Request additional permissions if needed
   */
  async requestAdditionalPermissions(missingScopes: string[]): Promise<GoogleFitAuthResult> {
    try {
      // Create a new auth request with only missing scopes
      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_FIT_OAUTH_CONFIG.expoClientId,
        scopes: missingScopes,
        responseType: GOOGLE_FIT_OAUTH_CONFIG.responseType,
        redirectUri: this.redirectUri,
        additionalParameters: {
          ...GOOGLE_FIT_OAUTH_CONFIG.additionalParameters,
          prompt: 'consent' // Force consent to ensure we get the new permissions
        },
      });

      const discovery = await AuthSession.fetchDiscoveryAsync(
        'https://accounts.google.com/.well-known/openid_configuration'
      );

      const result = await request.promptAsync(discovery);
      return await this.handleGoogleFitAuthResult(result);
    } catch (error) {
      console.error('Error requesting additional permissions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Permission request failed'
      };
    }
  }
}

export const googleFitAuthService = new GoogleFitAuthService();
export default googleFitAuthService; 