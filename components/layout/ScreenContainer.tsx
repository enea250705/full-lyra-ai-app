import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  paddingHorizontal?: number;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = true,
  onRefresh,
  refreshing = false,
  paddingHorizontal = 16,
}) => {
  if (scrollable) {
    return (
      <>
        <StatusBar style="dark" />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={true}
          alwaysBounceVertical={true}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <View style={[styles.container, { paddingHorizontal }]}>
        {children}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: 16,
    paddingBottom: 24,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 40,
  },
});