import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { JournalCard } from '@/components/ui/JournalCard';
import { useUserData } from '@/hooks/useUserData';
import { colors } from '@/constants/colors';
import { Mood } from '@/types';
import { StatusBar } from 'expo-status-bar';

export default function JournalScreen() {
  const { journalEntries, addJournalEntry } = useUserData();
  const [refreshing, setRefreshing] = useState(false);

  // Daily prompts
  const prompts = [
    "What made you smile today?",
    "What's something you're grateful for?",
    "What challenged you today?",
    "What drained your energy today?",
    "What's something you learned today?",
    "What's one thing you'd like to improve tomorrow?",
    "What's a small win you had today?",
  ];

  // Get a random prompt
  const getTodaysPrompt = () => {
    const today = new Date().getDate();
    return prompts[today % prompts.length];
  };

  const handleSaveEntry = (content: string, mood: Mood) => {
    addJournalEntry(content, mood, getTodaysPrompt());
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Daily Reflection</Text>
      <Text style={styles.headerSubtitle}>
        Take a moment to reflect on your day
      </Text>
      
      <JournalCard
        prompt={getTodaysPrompt()}
        onSave={handleSaveEntry}
      />
      
      {journalEntries.length > 0 && (
        <Text style={styles.pastEntriesTitle}>Past Entries</Text>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateText}>
        No journal entries yet. Start by adding your first reflection above.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <FlatList
        data={journalEntries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.entryContainer}>
            <JournalCard
              prompt={item.prompt}
              date={item.date}
              initialContent={item.content}
              onSave={() => {}}
              isEditing={false}
            />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerContainer: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.midnightBlue,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.gray[600],
    marginBottom: 24,
  },
  pastEntriesTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.midnightBlue,
    marginTop: 32,
    marginBottom: 8,
  },
  entryContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  emptyStateContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 24,
  },
});