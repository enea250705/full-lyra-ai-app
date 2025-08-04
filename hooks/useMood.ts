import React, { useState, useCallback, useEffect } from 'react';
import { apiService } from '../services/api';
import { useApi, useMutation } from './useApi';

export interface MoodEntry {
  id: string;
  moodValue: number;
  moodCategory?: string;
  notes?: string;
  createdAt: string;
}

export interface MoodTrends {
  trends: Array<{
    moodValue: number;
    moodCategory?: string;
    date: string;
  }>;
  average: number;
  period: string;
  totalEntries: number;
}

export const useMood = () => {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allMoodEntries, setAllMoodEntries] = useState<MoodEntry[]>([]);
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({});

  const {
    data: moodData,
    loading: loadingMood,
    error: moodError,
    refetch: refetchMood,
  } = useApi(() => apiService.getMoodEntries(page, 20, dateRange.startDate, dateRange.endDate), { 
    deps: [page, dateRange.startDate, dateRange.endDate] 
  });

  const {
    data: moodTrends,
    loading: loadingTrends,
    error: trendsError,
    refetch: refetchTrends,
  } = useApi<MoodTrends>(() => apiService.getMoodTrends('week'), { immediate: false });

  const createMoodMutation = useMutation<MoodEntry, {
    moodValue: number;
    moodCategory?: string;
    notes?: string;
  }>((data) => apiService.createMoodEntry(data.moodValue, data.moodCategory, data.notes));

  const updateMoodMutation = useMutation<MoodEntry, {
    id: string;
    moodValue: number;
    moodCategory?: string;
    notes?: string;
  }>((data) => apiService.updateMoodEntry(data.id, data.moodValue, data.moodCategory, data.notes));

  const deleteMoodMutation = useMutation<void, string>((id) => apiService.deleteMoodEntry(id));

  const loadMoreMoodEntries = useCallback(async () => {
    if (!hasMore || loadingMood) return;
    
    setPage(prev => prev + 1);
  }, [hasMore, loadingMood]);

  const refreshMoodEntries = useCallback(async () => {
    setPage(1);
    setAllMoodEntries([]);
    setHasMore(true);
    await refetchMood();
  }, [refetchMood]);

  const createMoodEntry = useCallback(async (
    moodValue: number,
    moodCategory?: string,
    notes?: string
  ) => {
    const newMoodEntry = await createMoodMutation.mutate({
      moodValue,
      moodCategory,
      notes,
    });
    
    // Add to beginning of all mood entries
    setAllMoodEntries(prev => [newMoodEntry, ...prev]);
    
    // Refresh trends
    await refetchTrends();
    
    return newMoodEntry;
  }, [createMoodMutation, refetchTrends]);

  const updateMoodEntry = useCallback(async (
    id: string,
    moodValue: number,
    moodCategory?: string,
    notes?: string
  ) => {
    const updatedMoodEntry = await updateMoodMutation.mutate({
      id,
      moodValue,
      moodCategory,
      notes,
    });
    
    // Update in all mood entries
    setAllMoodEntries(prev => prev.map(entry => 
      entry.id === id ? updatedMoodEntry : entry
    ));
    
    // Refresh trends
    await refetchTrends();
    
    return updatedMoodEntry;
  }, [updateMoodMutation, refetchTrends]);

  const deleteMoodEntry = useCallback(async (id: string) => {
    await deleteMoodMutation.mutate(id);
    
    // Remove from all mood entries
    setAllMoodEntries(prev => prev.filter(entry => entry.id !== id));
    
    // Refresh trends
    await refetchTrends();
  }, [deleteMoodMutation, refetchTrends]);

  const getMoodTrends = useCallback(async (period: 'day' | 'week' | 'month' = 'week') => {
    const response = await apiService.getMoodTrends(period);
    return response.data;
  }, []);

  const setDateFilter = useCallback((startDate?: string, endDate?: string) => {
    setDateRange({ startDate, endDate });
    setPage(1);
    setAllMoodEntries([]);
    setHasMore(true);
  }, []);

  // Update allMoodEntries when new data comes in
  useEffect(() => {
    if (moodData?.data) {
      if (page === 1) {
        setAllMoodEntries(moodData.data);
      } else {
        setAllMoodEntries(prev => [...prev, ...moodData.data]);
      }
      
      setHasMore(moodData.pagination.hasNext);
    }
  }, [moodData, page]);

  return {
    // Data
    moodEntries: allMoodEntries,
    moodTrends,
    
    // Loading states
    loadingMood,
    loadingTrends,
    loadingCreate: createMoodMutation.loading,
    loadingUpdate: updateMoodMutation.loading,
    loadingDelete: deleteMoodMutation.loading,
    
    // Error states
    moodError,
    trendsError,
    createError: createMoodMutation.error,
    updateError: updateMoodMutation.error,
    deleteError: deleteMoodMutation.error,
    
    // Actions
    createMoodEntry,
    updateMoodEntry,
    deleteMoodEntry,
    getMoodTrends,
    loadMoreMoodEntries,
    refreshMoodEntries,
    setDateFilter,
    
    // Pagination
    hasMore,
    page,
  };
};