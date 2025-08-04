import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import { useApi, useMutation } from './useApi';

export interface EnergyEntry {
  id: string;
  energyLevel: number;
  energyEmoji?: string;
  notes?: string;
  createdAt: string;
}

export interface EnergyTrends {
  trends: Array<{
    energyLevel: number;
    energyEmoji?: string;
    date: string;
  }>;
  average: number;
  period: string;
  totalEntries: number;
}

export const useEnergy = () => {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allEnergyEntries, setAllEnergyEntries] = useState<EnergyEntry[]>([]);
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({});

  const {
    data: energyData,
    loading: loadingEnergy,
    error: energyError,
    refetch: refetchEnergy,
  } = useApi(() => apiService.getEnergyEntries(page, 20, dateRange.startDate, dateRange.endDate), { 
    deps: [page, dateRange.startDate, dateRange.endDate] 
  });

  const {
    data: energyTrends,
    loading: loadingTrends,
    error: trendsError,
    refetch: refetchTrends,
  } = useApi<EnergyTrends>(() => apiService.getEnergyTrends('week'), { immediate: false });

  const createEnergyMutation = useMutation<EnergyEntry, {
    energyLevel: number;
    energyEmoji?: string;
    notes?: string;
  }>((data) => apiService.createEnergyEntry(data.energyLevel, data.energyEmoji, data.notes));

  const updateEnergyMutation = useMutation<EnergyEntry, {
    id: string;
    energyLevel: number;
    energyEmoji?: string;
    notes?: string;
  }>((data) => apiService.updateEnergyEntry(data.id, data.energyLevel, data.energyEmoji, data.notes));

  const deleteEnergyMutation = useMutation<void, string>((id) => apiService.deleteEnergyEntry(id));

  const createEnergyEntry = useCallback(async (
    energyLevel: number,
    energyEmoji?: string,
    notes?: string
  ) => {
    const newEnergyEntry = await createEnergyMutation.mutate({
      energyLevel,
      energyEmoji,
      notes,
    });
    
    setAllEnergyEntries(prev => [newEnergyEntry, ...prev]);
    await refetchTrends();
    
    return newEnergyEntry;
  }, [createEnergyMutation, refetchTrends]);

  const updateEnergyEntry = useCallback(async (
    id: string,
    energyLevel: number,
    energyEmoji?: string,
    notes?: string
  ) => {
    const updatedEnergyEntry = await updateEnergyMutation.mutate({
      id,
      energyLevel,
      energyEmoji,
      notes,
    });
    
    setAllEnergyEntries(prev => prev.map(entry => 
      entry.id === id ? updatedEnergyEntry : entry
    ));
    
    await refetchTrends();
    return updatedEnergyEntry;
  }, [updateEnergyMutation, refetchTrends]);

  const deleteEnergyEntry = useCallback(async (id: string) => {
    await deleteEnergyMutation.mutate(id);
    setAllEnergyEntries(prev => prev.filter(entry => entry.id !== id));
    await refetchTrends();
  }, [deleteEnergyMutation, refetchTrends]);

  const getEnergyTrends = useCallback(async (period: 'day' | 'week' | 'month' = 'week') => {
    const response = await apiService.getEnergyTrends(period);
    return response.data;
  }, []);

  const setDateFilter = useCallback((startDate?: string, endDate?: string) => {
    setDateRange({ startDate, endDate });
    setPage(1);
    setAllEnergyEntries([]);
    setHasMore(true);
  }, []);

  React.useEffect(() => {
    if (energyData?.data) {
      if (page === 1) {
        setAllEnergyEntries(energyData.data);
      } else {
        setAllEnergyEntries(prev => [...prev, ...energyData.data]);
      }
      setHasMore(energyData.pagination.hasNext);
    }
  }, [energyData, page]);

  return {
    energyEntries: allEnergyEntries,
    energyTrends,
    loadingEnergy,
    loadingTrends,
    loadingCreate: createEnergyMutation.loading,
    loadingUpdate: updateEnergyMutation.loading,
    loadingDelete: deleteEnergyMutation.loading,
    energyError,
    trendsError,
    createError: createEnergyMutation.error,
    updateError: updateEnergyMutation.error,
    deleteError: deleteEnergyMutation.error,
    createEnergyEntry,
    updateEnergyEntry,
    deleteEnergyEntry,
    getEnergyTrends,
    setDateFilter,
    hasMore,
    page,
  };
};