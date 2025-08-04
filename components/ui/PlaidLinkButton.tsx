import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { PlaidLink, LinkSuccess, LinkExit } from 'react-native-plaid-link-sdk';
import { useApi } from '../../hooks/useApi';

interface PlaidLinkButtonProps {
  onSuccess?: (publicToken: string, metadata: any) => void;
  onExit?: (error: any, metadata: any) => void;
  buttonText?: string;
  disabled?: boolean;
  style?: any;
}

export const PlaidLinkButton: React.FC<PlaidLinkButtonProps> = ({
  onSuccess,
  onExit,
  buttonText = "Connect Bank Account",
  disabled = false,
  style,
}) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { post } = useApi();

  const createLinkToken = async () => {
    try {
      setIsLoading(true);
      const response = await post('/plaid/link-token', {});
      
      if (response.success && response.data?.linkToken) {
        setLinkToken(response.data.linkToken);
        return response.data.linkToken;
      } else {
        throw new Error('Failed to create link token');
      }
    } catch (error: any) {
      console.error('Error creating link token:', error);
      Alert.alert(
        'Connection Error',
        'Unable to initialize bank connection. Please try again.',
        [{ text: 'OK' }]
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = async (success: LinkSuccess) => {
    try {
      console.log('Plaid Link success:', success);
      
      // Exchange public token for access token
      const response = await post('/plaid/exchange-token', {
        publicToken: success.publicToken,
      });

      if (response.success) {
        Alert.alert(
          'Success!',
          'Your bank account has been connected successfully.',
          [{ text: 'OK' }]
        );
        
        if (onSuccess) {
          onSuccess(success.publicToken, success.metadata);
        }
      } else {
        throw new Error('Failed to connect bank account');
      }
    } catch (error: any) {
      console.error('Error exchanging token:', error);
      Alert.alert(
        'Connection Error',
        'Unable to complete bank connection. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleExit = (exit: LinkExit) => {
    console.log('Plaid Link exit:', exit);
    
    if (exit.error) {
      console.error('Plaid Link error:', exit.error);
      Alert.alert(
        'Connection Cancelled',
        exit.error.displayMessage || 'Bank connection was cancelled.',
        [{ text: 'OK' }]
      );
    }
    
    if (onExit) {
      onExit(exit.error, exit.metadata);
    }
  };

  const handlePress = async () => {
    if (!linkToken) {
      const token = await createLinkToken();
      if (!token) return;
    }
  };

  return (
    <View style={style}>
      {linkToken ? (
        <PlaidLink
          tokenConfig={{
            token: linkToken,
          }}
          onSuccess={handleSuccess}
          onExit={handleExit}
        >
          <TouchableOpacity
            style={{
              backgroundColor: '#3B82F6',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
              opacity: disabled ? 0.6 : 1,
            }}
            disabled={disabled || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                textAlign: 'center',
              }}>
                {buttonText}
              </Text>
            )}
          </TouchableOpacity>
        </PlaidLink>
      ) : (
        <TouchableOpacity
          style={{
            backgroundColor: '#3B82F6',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
            opacity: disabled ? 0.6 : 1,
          }}
          disabled={disabled || isLoading}
          onPress={handlePress}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: '600',
              textAlign: 'center',
            }}>
              {buttonText}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};