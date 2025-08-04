import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import { useApi, useMutation } from './useApi';

export interface JournalEntry {
  id: string;
  title?: string;
  content?: string;
  voiceUrl?: string;
  isEncrypted: boolean;
  pinProtected: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useJournal = () => {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allJournalEntries, setAllJournalEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const {
    data: journalData,
    loading: loadingJournal,
    error: journalError,
    refetch: refetchJournal,
  } = useApi(() => apiService.getJournalEntries(page, 20, searchQuery), { 
    deps: [page, searchQuery] 
  });

  const createJournalMutation = useMutation<JournalEntry, {
    title?: string;
    content?: string;
    voiceUrl?: string;
    pinProtected?: boolean;
  }>((data) => apiService.createJournalEntry(data.title, data.content, data.voiceUrl, data.pinProtected));

  const updateJournalMutation = useMutation<JournalEntry, {
    id: string;
    title?: string;
    content?: string;
    voiceUrl?: string;
    pinProtected?: boolean;
  }>((data) => apiService.updateJournalEntry(data.id, data.title, data.content, data.voiceUrl, data.pinProtected));

  const deleteJournalMutation = useMutation<void, string>((id) => apiService.deleteJournalEntry(id));

  const getJournalEntryMutation = useMutation<JournalEntry, { id: string; pin?: string }>((data) => 
    apiService.getJournalEntry(data.id, data.pin)
  );

  const loadMoreJournalEntries = useCallback(async () => {
    if (!hasMore || loadingJournal) return;
    setPage(prev => prev + 1);
  }, [hasMore, loadingJournal]);

  const refreshJournalEntries = useCallback(async () => {
    setPage(1);
    setAllJournalEntries([]);
    setHasMore(true);
    await refetchJournal();
  }, [refetchJournal]);

  const createJournalEntry = useCallback(async (
    title?: string,
    content?: string,
    voiceUrl?: string,
    pinProtected?: boolean
  ) => {
    const newJournalEntry = await createJournalMutation.mutate({
      title,
      content,
      voiceUrl,
      pinProtected,
    });
    
    setAllJournalEntries(prev => [newJournalEntry, ...prev]);
    return newJournalEntry;
  }, [createJournalMutation]);

  const updateJournalEntry = useCallback(async (
    id: string,
    title?: string,
    content?: string,
    voiceUrl?: string,
    pinProtected?: boolean
  ) => {
    const updatedJournalEntry = await updateJournalMutation.mutate({
      id,
      title,
      content,
      voiceUrl,
      pinProtected,
    });
    
    setAllJournalEntries(prev => prev.map(entry => 
      entry.id === id ? updatedJournalEntry : entry
    ));
    
    return updatedJournalEntry;
  }, [updateJournalMutation]);

  const deleteJournalEntry = useCallback(async (id: string) => {
    await deleteJournalMutation.mutate(id);
    setAllJournalEntries(prev => prev.filter(entry => entry.id !== id));
  }, [deleteJournalMutation]);

  const getJournalEntry = useCallback(async (id: string, pin?: string) => {
    return await getJournalEntryMutation.mutate({ id, pin });
  }, [getJournalEntryMutation]);

  const searchJournalEntries = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setAllJournalEntries([]);
    setHasMore(true);
  }, []);

  React.useEffect(() => {
    if (journalData?.data) {
      if (page === 1) {
        setAllJournalEntries(journalData.data);
      } else {
        setAllJournalEntries(prev => [...prev, ...journalData.data]);
      }
      setHasMore(journalData.pagination.hasNext);
    }
  }, [journalData, page]);

  return {
    journalEntries: allJournalEntries,
    loadingJournal,
    loadingCreate: createJournalMutation.loading,
    loadingUpdate: updateJournalMutation.loading,
    loadingDelete: deleteJournalMutation.loading,
    loadingGet: getJournalEntryMutation.loading,
    journalError,
    createError: createJournalMutation.error,
    updateError: updateJournalMutation.error,
    deleteError: deleteJournalMutation.error,
    getError: getJournalEntryMutation.error,
    createJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    getJournalEntry,
    loadMoreJournalEntries,
    refreshJournalEntries,
    searchJournalEntries,
    searchQuery,
    hasMore,
    page,
  };
};