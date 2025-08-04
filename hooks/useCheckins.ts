import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import { useApi, useMutation } from './useApi';

export interface DailyCheckin {
  id: string;
  content?: string;
  moodEmoji?: string;
  voiceTranscriptionUrl?: string;
  aiReflection?: string;
  createdAt: string;
}

export const useCheckins = () => {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allCheckins, setAllCheckins] = useState<DailyCheckin[]>([]);

  const {
    data: checkinsData,
    loading: loadingCheckins,
    error: checkinsError,
    refetch: refetchCheckins,
  } = useApi(() => apiService.getCheckins(page), { deps: [page] });

  const {
    data: todayCheckin,
    loading: loadingTodayCheckin,
    error: todayCheckinError,
    refetch: refetchTodayCheckin,
  } = useApi(() => apiService.getTodayCheckin(), { immediate: false });

  const createCheckinMutation = useMutation<DailyCheckin, {
    content?: string;
    moodEmoji?: string;
    voiceTranscriptionUrl?: string;
  }>((data) => apiService.createCheckin(data.content, data.moodEmoji, data.voiceTranscriptionUrl));

  const updateCheckinMutation = useMutation<DailyCheckin, {
    id: string;
    content?: string;
    moodEmoji?: string;
    voiceTranscriptionUrl?: string;
  }>((data) => apiService.updateCheckin(data.id, data.content, data.moodEmoji, data.voiceTranscriptionUrl));

  const deleteCheckinMutation = useMutation<void, string>((id) => apiService.deleteCheckin(id));

  const loadMoreCheckins = useCallback(async () => {
    if (!hasMore || loadingCheckins) return;
    
    setPage(prev => prev + 1);
  }, [hasMore, loadingCheckins]);

  const refreshCheckins = useCallback(async () => {
    setPage(1);
    setAllCheckins([]);
    setHasMore(true);
    await refetchCheckins();
  }, [refetchCheckins]);

  const createCheckin = useCallback(async (
    content?: string,
    moodEmoji?: string,
    voiceTranscriptionUrl?: string
  ) => {
    const newCheckin = await createCheckinMutation.mutate({
      content,
      moodEmoji,
      voiceTranscriptionUrl,
    });
    
    // Refresh today's checkin
    await refetchTodayCheckin();
    
    // Add to beginning of all checkins
    setAllCheckins(prev => [newCheckin, ...prev]);
    
    return newCheckin;
  }, [createCheckinMutation, refetchTodayCheckin]);

  const updateCheckin = useCallback(async (
    id: string,
    content?: string,
    moodEmoji?: string,
    voiceTranscriptionUrl?: string
  ) => {
    const updatedCheckin = await updateCheckinMutation.mutate({
      id,
      content,
      moodEmoji,
      voiceTranscriptionUrl,
    });
    
    // Update in all checkins
    setAllCheckins(prev => prev.map(checkin => 
      checkin.id === id ? updatedCheckin : checkin
    ));
    
    // Refresh today's checkin if it's the one being updated
    await refetchTodayCheckin();
    
    return updatedCheckin;
  }, [updateCheckinMutation, refetchTodayCheckin]);

  const deleteCheckin = useCallback(async (id: string) => {
    await deleteCheckinMutation.mutate(id);
    
    // Remove from all checkins
    setAllCheckins(prev => prev.filter(checkin => checkin.id !== id));
    
    // Refresh today's checkin
    await refetchTodayCheckin();
  }, [deleteCheckinMutation, refetchTodayCheckin]);

  const getTodayCheckin = useCallback(async () => {
    await refetchTodayCheckin();
  }, [refetchTodayCheckin]);

  // Update allCheckins when new data comes in
  React.useEffect(() => {
    if (checkinsData?.data) {
      if (page === 1) {
        setAllCheckins(checkinsData.data);
      } else {
        setAllCheckins(prev => [...prev, ...checkinsData.data]);
      }
      
      setHasMore(checkinsData.pagination.hasNext);
    }
  }, [checkinsData, page]);

  return {
    // Data
    checkins: allCheckins,
    todayCheckin,
    
    // Loading states
    loadingCheckins,
    loadingTodayCheckin,
    loadingCreate: createCheckinMutation.loading,
    loadingUpdate: updateCheckinMutation.loading,
    loadingDelete: deleteCheckinMutation.loading,
    
    // Error states
    checkinsError,
    todayCheckinError,
    createError: createCheckinMutation.error,
    updateError: updateCheckinMutation.error,
    deleteError: deleteCheckinMutation.error,
    
    // Actions
    createCheckin,
    updateCheckin,
    deleteCheckin,
    getTodayCheckin,
    loadMoreCheckins,
    refreshCheckins,
    
    // Pagination
    hasMore,
    page,
  };
};