import React, { useEffect } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { UserDataProvider } from '../hooks/useUserData';
import { I18nProvider } from '../i18n';
import I18nSync from '../components/I18nSync';

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error('Font loading error:', error);
      // Don't throw error, just log it and continue
      SplashScreen.hideAsync();
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded && !error) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <UserDataProvider>
            <I18nProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <Stack
                  screenOptions={{
                    headerBackTitle: "Back",
                    headerStyle: {
                      backgroundColor: '#FFFFFF',
                    },
                    headerShadowVisible: false,
                    headerTitleStyle: {
                      fontWeight: '600',
                      color: '#1A1B41',
                    },
                    contentStyle: {
                      backgroundColor: '#FFFFFF',
                    },
                  }}
                >
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="auth" options={{ headerShown: false }} />
                  <Stack.Screen 
                    name="modal" 
                    options={{ 
                      presentation: "modal",
                      title: "About Lyra"
                    }} 
                  />
                </Stack>
                <I18nSync />
              </GestureHandlerRootView>
            </I18nProvider>
          </UserDataProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}