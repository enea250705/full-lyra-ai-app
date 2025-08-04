import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';

interface SavingsStats {
  total: {
    amount: number;
    count: number;
  };
  monthly: {
    amount: number;
    count: number;
    target: number;
  };
  byCategory: Array<{
    category: string;
    total: number;
    count: number;
  }>;
  byTrigger: Array<{
    trigger_type: string;
    total: number;
    count: number;
  }>;
  recent: Array<{
    id: string;
    amount: number;
    reason: string;
    category: string;
    savedAmount: number;
    triggerType: string;
    createdAt: string;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    emoji: string;
    unlocked: boolean;
  }>;
}

interface SavingsRecord {
  id: string;
  amount: number;
  reason: string;
  category: string;
  originalAmount: number;
  savedAmount: number;
  triggerType: string;
  createdAt: string;
}

export const useSavings = () => {
  const { request } = useApi();
  const [savings, setSavings] = useState<SavingsStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch savings statistics
  const fetchSavingsStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await request('/savings/stats', {
        method: 'GET',
      });
      
      if (response.success) {
        setSavings(response.data);
      } else {
        setError(response.error || 'Failed to fetch savings stats');
      }
    } catch (err) {
      setError('Failed to fetch savings stats');
      console.error('Savings stats error:', err);
    } finally {
      setLoading(false);
    }
  }, [request]);

  // Record a savings entry
  const recordSavings = useCallback(async (savingsData: {
    amount: number;
    reason: string;
    category?: string;
    originalAmount: number;
    triggerType?: string;
    metadata?: Record<string, any>;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await request('/savings/record', {
        method: 'POST',
        body: JSON.stringify(savingsData),
      });
      
      if (response.success) {
        // Refresh stats after recording
        await fetchSavingsStats();
        return response.data;
      } else {
        setError(response.error || 'Failed to record savings');
        return null;
      }
    } catch (err) {
      setError('Failed to record savings');
      console.error('Record savings error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [request, fetchSavingsStats]);

  // Get savings history
  const getSavingsHistory = useCallback(async (options?: {
    page?: number;
    limit?: number;
    category?: string;
    triggerType?: string;
  }) => {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.category) params.append('category', options.category);
    if (options?.triggerType) params.append('triggerType', options.triggerType);
    
    try {
      const response = await request(`/savings/history?${params.toString()}`, {
        method: 'GET',
      });
      
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to fetch savings history');
        return null;
      }
    } catch (err) {
      setError('Failed to fetch savings history');
      console.error('Savings history error:', err);
      return null;
    }
  }, [request]);

  // Update monthly savings target
  const updateSavingsTarget = useCallback(async (monthlyTarget: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await request('/savings/target', {
        method: 'PUT',
        body: JSON.stringify({ monthlyTarget }),
      });
      
      if (response.success) {
        await fetchSavingsStats(); // Refresh stats
        return true;
      } else {
        setError(response.error || 'Failed to update savings target');
        return false;
      }
    } catch (err) {
      setError('Failed to update savings target');
      console.error('Update target error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [request, fetchSavingsStats]);


  // Fetch stats on mount
  useEffect(() => {
    fetchSavingsStats();
  }, [fetchSavingsStats]);

  return {
    savings,
    loading,
    error,
    fetchSavingsStats,
    recordSavings,
    getSavingsHistory,
    updateSavingsTarget,
  };
};